// src/features/feed/hooks/useFeed.js
import { useCallback, useRef, useState, useEffect } from "react";
import { useActorStore } from "@/state/actors/actorStore";
import { hydrateActorsByIds } from "@hydration";
import { fetchFeedPagePipeline } from "@/features/feed/pipeline/fetchFeedPage.pipeline";
import { debugFeedEvent, debugFeedResult } from "@debuggers/feed";
import { startFeedSession, endFeedSession, recordStep } from "@debuggers/feed/feedProfiler";
import { withTimeout, preloadInitialMedia } from "@/features/feed/hooks/useFeed.utils";

const PAGE_SIZE = 10;
// Protect UX from long multi-page drains when many rows are filtered.
const MAX_EMPTY_PAGES_PER_FETCH = 3;
const INITIAL_VISIBLE_TARGET = 3;

export function useFeed(viewerActorId, realmId, { viewerIsAdult: viewerIsAdultProp = null } = {}) {
  const [posts, setPosts] = useState([]);
  const [filterDebugRows, setFilterDebugRows] = useState([]);
  // viewerIsAdult is now passed from the identity context (identity.isAdult)
  // instead of being independently fetched via getFeedViewerIsAdult.
  const viewerIsAdult = viewerIsAdultProp;
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [firstBatchReady, setFirstBatchReady] = useState(false);

  // ✅ server-driven hidden posts for this viewer (persisted)
  const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set());

  const cursorRef = useRef(null);
  const didInitialFetchRef = useRef(false);
  const loadingRef = useRef(false);
  const requestVersionRef = useRef(0);
  // Timestamp of last successful fetch — used by IntersectionObserver to avoid
  // firing a pagination request immediately after the initial batch completes.
  const lastFetchAtRef = useRef(0);

  const upsertActors = useActorStore((s) => s.upsertActors);
  const getMissingOrStale = useActorStore((s) => s.getMissingOrStale);

  // Stable refs for Zustand store methods — these never change identity, but
  // including them in useCallback deps would make fetchPosts unstable whenever
  // the store re-renders the component. Using refs keeps fetchPosts reference
  // stable across store updates, preventing the initial fetch effect from
  // re-triggering.
  const upsertActorsRef = useRef(upsertActors);
  upsertActorsRef.current = upsertActors;
  const getMissingOrStaleRef = useRef(getMissingOrStale);
  getMissingOrStaleRef.current = getMissingOrStale;

  useEffect(() => {
    requestVersionRef.current += 1;
    didInitialFetchRef.current = false;
    cursorRef.current = null;
    loadingRef.current = false;
    lastFetchAtRef.current = 0;

    setPosts([]);
    setHasMore(true);
    setLoading(false);
    setFirstBatchReady(false);
    setFilterDebugRows([]);

    setHiddenPostIds(new Set());
  }, [viewerActorId, realmId]);

  /* ============================================================
     FETCH FEED
     ============================================================ */
  const fetchPosts = useCallback(
    async (fresh = false) => {
      const requestVersion = requestVersionRef.current;

      try {
        if (!viewerActorId) {
          if (import.meta.env.DEV) debugFeedEvent('FEED_REQUEST_SKIPPED', { status: 'warn', message: 'No viewerActorId' })
          return;
        }
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);

        if (import.meta.env.DEV) {
          debugFeedEvent('FEED_REQUEST_START', {
            status: 'start',
            message: fresh ? 'Fresh fetch' : 'Paginate',
            payload: { viewerActorId, realmId, fresh, requestVersion },
          })
          startFeedSession({ viewerActorId, realmId, fresh, requestVersion })
        }

        if (fresh) {
          cursorRef.current = null;
          setHiddenPostIds(new Set());
          setFirstBatchReady(false);
        }

        // Keep first paint fast: do not over-fetch 10 fully hydrated visible posts
        // before showing anything to the user.
        const targetVisibleCount = fresh ? INITIAL_VISIBLE_TARGET : 1;
        const normalizedChunk = [];
        let cursorCreatedAt = fresh ? null : cursorRef.current?.created_at ?? null;
        let hasMoreNow = true;
        let pagesFetched = 0;

        while (hasMoreNow && pagesFetched < MAX_EMPTY_PAGES_PER_FETCH) {
          pagesFetched += 1;

          const res = await withTimeout(
            fetchFeedPagePipeline({
              viewerActorId,
              realmId,
              cursorCreatedAt,
              pageSize: PAGE_SIZE,
            })
          );

          if (requestVersionRef.current !== requestVersion) return;

          const {
            normalized,
            debugRows,
            hasMoreNow: nextHasMore,
            nextCursorCreatedAt,
            hiddenByMeSet,
            actors,
            profileMap,
            vportMap,
          } = res;

          // Immediate upsert from pipeline data (fast, no extra network)
          upsertActorsRef.current(
            (actors || []).map((a) => ({
              actor_id: a.id,
              kind: a.kind,
              display_name: a.profile_id ? profileMap[a.profile_id]?.display_name ?? null : null,
              username: a.profile_id ? profileMap[a.profile_id]?.username ?? null : null,
              photo_url: a.profile_id
                ? profileMap[a.profile_id]?.photo_url ?? null
                : vportMap[a.id]?.avatar_url ?? null,
              vport_name: a.kind === 'vport' ? vportMap[a.id]?.name ?? null : null,
              vport_slug: a.kind === 'vport' ? vportMap[a.id]?.slug ?? null : null,
            }))
          );

          if (import.meta.env.DEV) recordStep("actor_upsert_complete", { actorCount: (actors || []).length });

          // Background canonical hydration — only for actors that are stale or missing.
          // The pipeline's upsertActors() already populated fresh data above,
          // so this only fires for actors the store didn't have or that expired.
          const feedActorIds = (actors || []).map((a) => a.id).filter(Boolean);
          const staleOrMissing = getMissingOrStaleRef.current(feedActorIds);
          if (staleOrMissing.length) {
            if (import.meta.env.DEV) recordStep("hydration_start_background", { total: feedActorIds.length, staleOrMissing: staleOrMissing.length });
            hydrateActorsByIds(staleOrMissing).catch(() => {});
          } else if (import.meta.env.DEV) {
            recordStep("hydration_skipped_all_fresh", { actorCount: feedActorIds.length });
          }

          // vport.profiles has owner-only RLS → vportMap is empty for non-owner users.
          // These actors were stamped fresh by the upsert above but have null names.
          // Force the canonical RPC (vc.get_actor_summaries, SECURITY DEFINER) for them.
          const vportActorsWithNoName = (actors || [])
            .filter((a) => a.kind === 'vport' && !vportMap[a.id]?.name)
            .map((a) => a.id)
            .filter((id) => !staleOrMissing.includes(id));
          if (vportActorsWithNoName.length) {
            hydrateActorsByIds(vportActorsWithNoName, { force: true }).catch(() => {});
          }

          setHiddenPostIds((prev) => {
            const next = new Set(prev);
            hiddenByMeSet.forEach((id) => next.add(id));
            return next;
          });

          normalizedChunk.push(...(normalized || []));
          setFilterDebugRows((prev) => {
            const incoming = Array.isArray(debugRows) ? debugRows : [];
            if (fresh) return incoming;

            const byPostId = new Map(
              (Array.isArray(prev) ? prev : []).map((row) => [row.post_id, row])
            );
            for (const row of incoming) {
              if (!row?.post_id) continue;
              byPostId.set(row.post_id, row);
            }
            return Array.from(byPostId.values());
          });

          hasMoreNow = !!nextHasMore;
          cursorCreatedAt = nextCursorCreatedAt ?? null;

          if (!hasMoreNow || !nextCursorCreatedAt || normalizedChunk.length >= targetVisibleCount) {
            break;
          }
        }

        // Feed debugger: log pipeline result
        if (import.meta.env.DEV) {
          debugFeedEvent('FEED_REQUEST_SUCCESS', {
            status: 'success',
            message: `${normalizedChunk.length} visible from ${pagesFetched} page(s)`,
            payload: { viewerActorId, realmId, pagesFetched, visibleCount: normalizedChunk.length, hasMoreNow },
          })
          debugFeedResult({
            rawCount: filterDebugRows.length + (normalizedChunk.length || 0),
            filteredCount: normalizedChunk.length,
            renderedCount: normalizedChunk.length,
            debugRows: filterDebugRows,
            hiddenByMeCount: hiddenPostIds.size,
            hasMore: hasMoreNow,
          })
        }

        // Fail-safe: stop pagination loops when we cannot surface any visible post
        // after draining multiple backend pages in one fetch cycle.
        if (normalizedChunk.length === 0 && hasMoreNow && pagesFetched >= MAX_EMPTY_PAGES_PER_FETCH) {
          hasMoreNow = false;
        }

        cursorRef.current = cursorCreatedAt ? { created_at: cursorCreatedAt } : null;

        if (fresh) {
          await preloadInitialMedia(normalizedChunk);
          if (requestVersionRef.current !== requestVersion) return;
        }

        setPosts((prev) => {
          if (fresh) return normalizedChunk;
          const map = new Map(prev.map((p) => [p.id, p]));
          normalizedChunk.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });

        setHasMore(hasMoreNow);
        if (fresh) {
          setFirstBatchReady(true);
        }
      } catch (e) {
        console.warn("[useFeed] error", e);
        setHasMore(false);
        if (fresh) {
          setFirstBatchReady(true);
        }
      } finally {
        if (import.meta.env.DEV) endFeedSession();
        lastFetchAtRef.current = Date.now();
        loadingRef.current = false;
        if (requestVersionRef.current === requestVersion) {
          setLoading(false);
        }
      }
    },
    [viewerActorId, realmId]
  );

  useEffect(() => {
    if (!viewerActorId) return;
    if (didInitialFetchRef.current) return;

    didInitialFetchRef.current = true;
    fetchPosts(true);
  }, [viewerActorId, fetchPosts]);

  return {
    posts,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    hiddenPostIds,
    filterDebugRows,
    firstBatchReady,
  };
}
