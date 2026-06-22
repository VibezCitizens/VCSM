// src/features/post/postcard/hooks/usePostReactions.js
// ============================================================
// Post Reactions Hook
// - UI lifecycle only
// - Controllers are authoritative
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

import { togglePostReactionController } from
  "../controllers/togglePostReaction.controller";

import { getPostReactionsController } from
  "../controllers/getPostReactions.controller";

import { sendRoseController } from
  "../controllers/sendRose.controller";

export function usePostReactions(postId, { preloadedReaction = null, preloadedCounts = null } = {}) {
  const { identity, loading: identityLoading } = useIdentity();
  const actorId = identity?.actorId ?? null;

  const hasPreloaded = preloadedCounts != null;

  const [myReaction, setMyReaction] = useState(preloadedReaction);
  const [counts, setCounts] = useState(
    preloadedCounts ?? { like: 0, dislike: 0, rose: 0 }
  );
  const [loading, setLoading] = useState(false);

  /* ============================================================
     INITIAL LOAD (AUTHORITATIVE READ)
     Skipped when pre-loaded data is provided (feed pipeline batch).
     ============================================================ */
  useEffect(() => {
    // Skip fetch when feed pipeline already provided batch data
    if (hasPreloaded) return;
    if (!postId || !actorId || identityLoading) return;

    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const result = await getPostReactionsController({
          postId,
          actorId,
        });

        if (!alive) return;
        setMyReaction(result.myReaction);
        setCounts(result.counts);
      } catch (err) {
        console.error("[usePostReactions] load failed:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [postId, actorId, identityLoading, hasPreloaded]);

  /* ============================================================
     TOGGLE LIKE / DISLIKE
     ============================================================ */
  const toggleReaction = useCallback(
    async (reaction) => {
      if (!postId || !actorId || loading) return;

      setLoading(true);
      try {
        const result = await togglePostReactionController({
          postId,
          actorId,
          reaction,
          currentCounts: counts,
        });

        setMyReaction(result.reaction);
        setCounts(result.counts);
      } catch (err) {
        console.error("[usePostReactions] toggle failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [postId, actorId, loading]
  );

  /* ============================================================
     SEND ROSE
     ============================================================ */
  const sendRose = useCallback(
    async (qty = 1) => {
      if (!postId || !actorId || loading) return;

      setLoading(true);
      try {
        const result = await sendRoseController({
          postId,
          actorId,
          qty,
        });

        setCounts(result.counts);
      } catch (err) {
        console.error("[usePostReactions] sendRose failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [postId, actorId, loading]
  );

  return {
    toggleReaction,
    sendRose,
    myReaction,
    counts,
    loading: loading || identityLoading,
  };
}

export default usePostReactions;
