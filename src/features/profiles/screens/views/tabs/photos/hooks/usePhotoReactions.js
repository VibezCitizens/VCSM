// src/features/profiles/screens/views/tabs/photos/hooks/usePhotoReactions.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ✅ READ/WRITE controllers for Photos tab
import {
  enrichPhotoPostsController,
  togglePhotoReactionController,
  sendPhotoRoseController,
} from "../controllers/photoReactions.controller";

export function usePhotoReactions(posts = [], actorId) {
  const safePosts = useMemo(() => (Array.isArray(posts) ? posts : []), [posts]);

  // Track latest posts to clean up removed ones
  const postIds = useMemo(() => safePosts.map((p) => p?.id).filter(Boolean), [safePosts]);
  const postIdsSetRef = useRef(new Set());

  // ✅ Server-enriched base (source of truth for counts)
  const [serverPosts, setServerPosts] = useState(() => []);
  const [loading, setLoading] = useState(false);

  /**
   * Local optimistic state keyed by postId
   * IMPORTANT:
   * - missing key => no local override (use server truth)
   * - key present with value "like"/"dislike" => forced local reaction
   * - key present with value null => explicitly cleared (toggled off)
   */
  const [reactionByPost, setReactionByPost] = useState(() => ({})); // { [postId]: "like"|"dislike"|null }
  const [roseByPost, setRoseByPost] = useState(() => ({})); // { [postId]: number }

  // ----------------------------------------------------------
  // CLEANUP: remove stale local keys when posts list changes
  // ----------------------------------------------------------
  useEffect(() => {
    const nextSet = new Set(postIds);
    const prevSet = postIdsSetRef.current;

    if (prevSet.size) {
      setReactionByPost((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (!nextSet.has(key)) {
            delete next[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });

      setRoseByPost((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (!nextSet.has(key)) {
            delete next[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }

    postIdsSetRef.current = nextSet;
  }, [postIds]);

  // ----------------------------------------------------------
  // ✅ ENRICH FROM DB (likeCount/dislikeCount/userHasReacted)
  // ----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!actorId || safePosts.length === 0) {
        setServerPosts([]);
        return;
      }

      setLoading(true);
      try {
        const enriched = await enrichPhotoPostsController({
          posts: safePosts,
          actorId,
        });

        if (!cancelled) setServerPosts(Array.isArray(enriched) ? enriched : []);
      } catch (e) {
        console.warn("[usePhotoReactions] enrich failed:", e);
        if (!cancelled) setServerPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [actorId, safePosts]);

  // Map server posts by id for stable lookup
  const serverById = useMemo(() => {
    const map = {};
    for (const p of serverPosts || []) {
      if (p?.id) map[p.id] = p;
    }
    return map;
  }, [serverPosts]);

  // ----------------------------------------------------------
  // UI-ready enriched posts (server base + local optimistic)
  // ----------------------------------------------------------
  const enriched = useMemo(() => {
    return safePosts.map((raw) => {
      const id = raw?.id;
      const base = id && serverById[id] ? serverById[id] : raw;

      // Base counts from server (or raw fallback)
      const baseLike = Number(base?.likeCount || 0);
      const baseDislike = Number(base?.dislikeCount || 0);
      const baseRose = Number(base?.roseCount || 0);
      const baseComments = Number(base?.commentCount || 0);

      // ✅ detect if local override exists
      const hasLocalReaction =
        !!id && Object.prototype.hasOwnProperty.call(reactionByPost, id);

      const myReaction = hasLocalReaction ? reactionByPost[id] : undefined; // undefined means "no override"
      const prevReaction = base?.userHasReacted ?? null;

      // Viewer reaction: local override wins only if present
      const userHasReacted =
        myReaction === undefined ? prevReaction : myReaction;

      // Counts default to server truth
      let likeCount = baseLike;
      let dislikeCount = baseDislike;

      // ✅ Only adjust counts if we actually have a local override
      if (id && myReaction !== undefined) {
        // remove prev (if server had one)
        if (prevReaction === "like") likeCount = Math.max(0, likeCount - 1);
        if (prevReaction === "dislike") dislikeCount = Math.max(0, dislikeCount - 1);

        // add new (if local is like/dislike, not null)
        if (myReaction === "like") likeCount += 1;
        if (myReaction === "dislike") dislikeCount += 1;
      }

      // Roses optimistic
      const localRoses = id ? roseByPost[id] ?? 0 : 0;
      const roseCount = baseRose + localRoses;

      return {
        ...raw,

        // --- Compatibility fields ---
        myReaction: userHasReacted, // keep consistent
        reactionCounts: { like: likeCount, dislike: dislikeCount },
        roses: roseCount,

        // --- Fields your UI reads ---
        userHasReacted,
        likeCount,
        dislikeCount,
        roseCount,
        commentCount: baseComments,
      };
    });
  }, [safePosts, serverById, reactionByPost, roseByPost]);

  // ----------------------------------------------------------
  // ✅ Toggle like/dislike (optimistic + backend)
  // ----------------------------------------------------------
  const toggleReaction = useCallback(
    async (postId, reactionType = "like") => {
      if (!actorId || !postId) return;

      // optimistic local:
      // - if clicking same reaction => clear override by setting null (explicitly off)
      // - otherwise set to reactionType
      setReactionByPost((prev) => {
        const hasKey = Object.prototype.hasOwnProperty.call(prev, postId);
        const current = hasKey ? prev[postId] : undefined; // undefined => no override
        const effective = current === undefined ? null : current; // for comparison only

        // Effective current should include server, but we don't have it here — that's ok.
        // This logic is purely "toggle the button you clicked":
        const nextValue = effective === reactionType ? null : reactionType;

        return { ...prev, [postId]: nextValue };
      });

      try {
        await togglePhotoReactionController({
          postId,
          actorId,
          reaction: reactionType,
        });

        // Refresh server truth so counts match DB
        const refreshed = await enrichPhotoPostsController({
          posts: safePosts,
          actorId,
        });

        setServerPosts(Array.isArray(refreshed) ? refreshed : []);

        // ✅ IMPORTANT: after refresh, remove local override so UI = server truth
        setReactionByPost((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      } catch (e) {
        console.warn("[usePhotoReactions] toggle failed:", e);

        // rollback optimistic change
        setReactionByPost((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      }
    },
    [actorId, safePosts]
  );

  // ----------------------------------------------------------
  // ✅ Send rose (optimistic + backend)
  // ----------------------------------------------------------
  const sendRose = useCallback(
    async (postId) => {
      if (!actorId || !postId) return;

      setRoseByPost((prev) => {
        const current = prev[postId] ?? 0;
        return { ...prev, [postId]: current + 1 };
      });

      try {
        await sendPhotoRoseController({
          postId,
          actorId,
          qty: 1,
        });

        const refreshed = await enrichPhotoPostsController({
          posts: safePosts,
          actorId,
        });

        setServerPosts(Array.isArray(refreshed) ? refreshed : []);
      } catch (e) {
        console.warn("[usePhotoReactions] rose failed:", e);

        // rollback optimistic
        setRoseByPost((prev) => {
          const current = prev[postId] ?? 0;
          const nextVal = Math.max(0, current - 1);
          return { ...prev, [postId]: nextVal };
        });
      }
    },
    [actorId, safePosts]
  );

  return { enriched, toggleReaction, sendRose, loading };
}
