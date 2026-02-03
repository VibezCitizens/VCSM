// src/features/feed/hooks/useFeed.js
import { useCallback, useRef, useState, useEffect } from "react";
import { supabase } from "@/services/supabase/supabaseClient";
import { useActorStore } from "@/state/actors/actorStore";
import { fetchFeedPagePipeline } from "@/features/feed/pipeline/fetchFeedPage.pipeline";

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

  const upsertActors = useActorStore((s) => s.upsertActors);

  useEffect(() => {
    console.log("[useFeed] MOUNT", { viewerActorId, realmId });
    return () => console.log("[useFeed] UNMOUNT", { viewerActorId, realmId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
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
      try {
        if (!viewerActorId || !realmId) return;
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);

        if (fresh) cursorRef.current = null;

        const PAGE = 10;

        const debugPostId = "54316847-5455-4a52-b704-8ac480e12c95";

        const res = await fetchFeedPagePipeline({
          viewerActorId,
          realmId,
          cursorCreatedAt: cursorRef.current?.created_at ?? null,
          pageSize: PAGE,
          debugPostId,
        });

        const { normalized, hasMoreNow, nextCursorCreatedAt, hiddenByMeSet, actors, profileMap, vportMap } = res;

        // UPSERT ACTORS (same shape as before)
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
          const next = fresh ? new Set() : new Set(prev);
          hiddenByMeSet.forEach((id) => next.add(id));
          return next;
        });

        if (nextCursorCreatedAt) cursorRef.current = { created_at: nextCursorCreatedAt };

        setPosts((prev) => {
          if (fresh) return normalized;
          const map = new Map(prev.map((p) => [p.id, p]));
          normalized.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });

        setHasMore(hasMoreNow);
      } catch (e) {
        console.warn("[useFeed] error", e);
        setHasMore(false);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [viewerActorId, realmId, upsertActors]
  );

  useEffect(() => {
    if (!viewerActorId || !realmId) return;
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
