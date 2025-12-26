// src/features/post/postcard/hooks/usePostReactions.js
// ============================================================
// Post Reactions Hook
// - UI lifecycle only
// - Controllers are authoritative
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { useIdentity } from "@/state/identity/identityContext";

import { togglePostReactionController } from
  "../controller/togglePostReaction.controller";

import { getPostReactionsController } from
  "../controller/getPostReactions.controller";

import { sendRoseController } from
  "../controller/sendRose.controller";

export function usePostReactions(postId) {
  const { identity, loading: identityLoading } = useIdentity();
  const actorId = identity?.actorId ?? null;

  const [myReaction, setMyReaction] = useState(null);
  const [counts, setCounts] = useState({
    like: 0,
    dislike: 0,
    rose: 0,
  });
  const [loading, setLoading] = useState(false);

  /* ============================================================
     INITIAL LOAD (AUTHORITATIVE READ)
     ============================================================ */
  useEffect(() => {
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
  }, [postId, actorId, identityLoading]);

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
