import { useEffect, useState, useCallback } from "react";

import {
  enrichPhotoPostsController,
  togglePhotoReactionController,
  sendPhotoRoseController,
} from "../controllers/photoReactions.controller";

/**
 * ============================================================
 * Hook: usePhotoReactions
 * ------------------------------------------------------------
 * UI orchestration layer for photo reactions
 *
 * Answers ONE question:
 *   "When should photo reactions load and how should the UI respond?"
 *
 * 🚫 No Supabase
 * 🚫 No DAL
 * 🚫 No business meaning
 * ============================================================
 */

export function usePhotoReactions(posts = [], actorId) {
  const [enriched, setEnriched] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------------------------------------------------------
     LOAD + ENRICH POSTS
     --------------------------------------------------------- */
  const load = useCallback(async () => {
    if (!actorId || posts.length === 0) {
      setEnriched([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await enrichPhotoPostsController({
        posts,
        actorId,
      });

      setEnriched(result);
    } catch (err) {
      console.error("[usePhotoReactions] load failed", err);
      setError(err);
      setEnriched([]);
    } finally {
      setLoading(false);
    }
  }, [posts, actorId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await load();
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  /* ---------------------------------------------------------
     TOGGLE REACTION (LIKE / DISLIKE)
     --------------------------------------------------------- */
  const toggleReaction = useCallback(
    async (postId, reaction) => {
      if (!actorId || !postId) return;

      try {
        await togglePhotoReactionController({
          postId,
          actorId,
          reaction,
        });

        // refresh after mutation
        await load();
      } catch (err) {
        console.error("[usePhotoReactions] toggleReaction failed", err);
        setError(err);
      }
    },
    [actorId, load]
  );

  /* ---------------------------------------------------------
     SEND ROSE
     --------------------------------------------------------- */
  const sendRose = useCallback(
    async (postId) => {
      if (!actorId || !postId) return;

      try {
        await sendPhotoRoseController({
          postId,
          actorId,
          qty: 1,
        });

        // refresh after mutation
        await load();
      } catch (err) {
        console.error("[usePhotoReactions] sendRose failed", err);
        setError(err);
      }
    },
    [actorId, load]
  );

  /* ---------------------------------------------------------
     PUBLIC API
     --------------------------------------------------------- */
  return {
    enriched,
    loading,
    error,

    toggleReaction,
    sendRose,
    reload: load,
  };
}
