// src/features/feed/hooks/useFeed.js
import { useCallback, useRef, useState, useEffect } from "react";
import { supabase } from "@/services/supabase/supabaseClient";
import { useActorStore } from "@/state/actors/actorStore";
import { fetchFeedPagePipeline } from "@/features/feed/pipeline/fetchFeedPage.pipeline";

const PAGE_SIZE = 10;
// Protect UX from long multi-page drains when many rows are filtered.
const MAX_EMPTY_PAGES_PER_FETCH = 3;
const INITIAL_VISIBLE_TARGET = 3;

export function useFeed(viewerActorId, realmId) {
  const [posts, setPosts] = useState([]);
  const [viewerIsAdult, setViewerIsAdult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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

    setHiddenPostIds(new Set());
  }, [viewerActorId, realmId]);

  /* ============================================================
     VIEWER CONTEXT
     ============================================================ */
  const fetchViewer = useCallback(async () => {
    try {
      if (!viewerActorId) {
        setViewerIsAdult(null);
        return;
      }

      const { data: actor } = await supabase
        .schema("vc")
        .from("actors")
        .select("profile_id, vport_id")
        .eq("id", viewerActorId)
        .maybeSingle();

      if (actor?.vport_id) {
        setViewerIsAdult(true);
        return;
      }

      if (!actor?.profile_id) {
        setViewerIsAdult(null);
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("is_adult")
        .eq("id", actor.profile_id)
        .maybeSingle();

      setViewerIsAdult(prof?.is_adult ?? null);
    } catch {
      setViewerIsAdult(null);
    }
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

          const res = await fetchFeedPagePipeline({
            viewerActorId,
            realmId,
            cursorCreatedAt,
            pageSize: PAGE_SIZE,
          });

          if (requestVersionRef.current !== requestVersion) return;

          const {
            normalized,
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

        setPosts((prev) => {
          if (fresh) return normalizedChunk;
          const map = new Map(prev.map((p) => [p.id, p]));
          normalizedChunk.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });

        setHasMore(hasMoreNow);
      } catch (e) {
        console.warn("[useFeed] error", e);
        setHasMore(false);
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
  };
}
