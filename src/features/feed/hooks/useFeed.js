// src/features/feed/hooks/useFeed.js
import { useCallback, useRef, useState, useEffect } from "react";
import { useActorStore } from "@/state/actors/actorStore";
import { fetchFeedPagePipeline } from "@/features/feed/pipeline/fetchFeedPage.pipeline";
import { getFeedViewerIsAdult } from "@/features/feed/controllers/getFeedViewerContext.controller";

const PAGE_SIZE = 10;
// Protect UX from long multi-page drains when many rows are filtered.
const MAX_EMPTY_PAGES_PER_FETCH = 3;
const INITIAL_VISIBLE_TARGET = 3;
const FEED_FETCH_TIMEOUT_MS = 15_000;
const FIRST_BATCH_MEDIA_PRELOAD_TIMEOUT_MS = 2_500;

function withTimeout(promise, ms = FEED_FETCH_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Feed fetch timeout")), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

function collectInitialImageUrls(posts, postLimit = INITIAL_VISIBLE_TARGET) {
  return (Array.isArray(posts) ? posts : [])
    .slice(0, postLimit)
    .map((post) => {
      const media = Array.isArray(post?.media) ? post.media : [];
      const firstImage = media.find((m) => m?.type === "image" && typeof m?.url === "string");
      return firstImage?.url ?? null;
    })
    .filter(Boolean);
}

function preloadImage(src, timeoutMs = FIRST_BATCH_MEDIA_PRELOAD_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(false);
      return;
    }

    const img = new Image();
    let settled = false;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };

    const timeoutId = setTimeout(() => finish(false), timeoutMs);

    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.decoding = "async";
    img.src = src;

    if (img.complete) {
      finish(true);
      return;
    }

    if (typeof img.decode === "function") {
      img.decode().then(() => finish(true)).catch(() => {});
    }
  });
}

async function preloadInitialMedia(posts) {
  const urls = collectInitialImageUrls(posts);
  if (urls.length === 0) return;
  await Promise.allSettled(urls.map((src) => preloadImage(src)));
}

export function useFeed(viewerActorId, realmId) {
  const [posts, setPosts] = useState([]);
  const [filterDebugRows, setFilterDebugRows] = useState([]);
  const [viewerIsAdult, setViewerIsAdult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [firstBatchReady, setFirstBatchReady] = useState(false);

  // ✅ server-driven hidden posts for this viewer (persisted)
  const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set());

  const cursorRef = useRef(null);
  const didInitialFetchRef = useRef(false);
  const loadingRef = useRef(false);
  const requestVersionRef = useRef(0);

  const upsertActors = useActorStore((s) => s.upsertActors);

  useEffect(() => {
    requestVersionRef.current += 1;
    didInitialFetchRef.current = false;
    cursorRef.current = null;
    loadingRef.current = false;

    setPosts([]);
    setHasMore(true);
    setLoading(false);
    setViewerIsAdult(null);
    setFirstBatchReady(false);
    setFilterDebugRows([]);

    setHiddenPostIds(new Set());
  }, [viewerActorId, realmId]);

  /* ============================================================
     VIEWER CONTEXT
     ============================================================ */
  const fetchViewer = useCallback(async () => {
    const value = await getFeedViewerIsAdult({ viewerActorId });
    setViewerIsAdult(value);
  }, [viewerActorId]);

  /* ============================================================
     FETCH FEED
     ============================================================ */
  const fetchPosts = useCallback(
    async (fresh = false) => {
      const requestVersion = requestVersionRef.current;

      try {
        if (!viewerActorId) return;
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);

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

          upsertActors(
            (actors || []).map((a) => ({
              actor_id: a.id,
              kind: a.kind,
              display_name: a.profile_id ? profileMap[a.profile_id]?.display_name ?? null : null,
              username: a.profile_id ? profileMap[a.profile_id]?.username ?? null : null,
              photo_url: a.profile_id
                ? profileMap[a.profile_id]?.photo_url ?? null
                : vportMap[a.vport_id]?.avatar_url ?? null,
              vport_name: a.vport_id ? vportMap[a.vport_id]?.name ?? null : null,
              vport_slug: a.vport_id ? vportMap[a.vport_id]?.slug ?? null : null,
            }))
          );

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
        loadingRef.current = false;
        if (requestVersionRef.current === requestVersion) {
          setLoading(false);
        }
      }
    },
    [viewerActorId, realmId, upsertActors]
  );

  useEffect(() => {
    if (!viewerActorId) return;
    if (didInitialFetchRef.current) return;

    didInitialFetchRef.current = true;
    fetchPosts(true);
  }, [viewerActorId, realmId, fetchPosts]);

  return {
    posts,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    fetchViewer,
    hiddenPostIds,
    filterDebugRows,
    firstBatchReady,
  };
}
