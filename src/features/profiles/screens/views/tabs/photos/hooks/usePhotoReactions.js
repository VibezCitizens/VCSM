import { useEffect, useState, useCallback } from "react";
import { useIdentity } from "@/state/identity/identityContext";

import {
  enrichPhotoPostsController,
  togglePhotoReactionController,
  sendPhotoRoseController,
} from "../controllers/photoReactions.controller";

/**
 * ============================================================
 * Hook: usePhotoReactions
 * ------------------------------------------------------------
 * Viewer-actor SSOT:
 * - Identity provides the reacting actorId
 * - Profile actorId is NEVER used for mutations
 * ============================================================
 */
export function usePhotoReactions(posts = []) {
  const { identity, loading: identityLoading } = useIdentity();
  const viewerActorId = identity?.actorId ?? null;

  const [enriched, setEnriched] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!viewerActorId || identityLoading || posts.length === 0) {
      setEnriched([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await enrichPhotoPostsController({
        posts,
        actorId: viewerActorId,
      });

      setEnriched(result);
    } catch (err) {
      console.error("[usePhotoReactions] load failed", err);
      setError(err);
      setEnriched([]);
    } finally {
      setLoading(false);
    }
  }, [posts, viewerActorId, identityLoading]);

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

  const toggleReaction = useCallback(
    async (postId, reaction) => {
      if (!viewerActorId || identityLoading || !postId) return;

      try {
        await togglePhotoReactionController({
          postId,
          actorId: viewerActorId,
          reaction,
        });

        await load();
      } catch (err) {
        console.error("[usePhotoReactions] toggleReaction failed", err);
        setError(err);
      }
    },
    [viewerActorId, identityLoading, load]
  );

  const sendRose = useCallback(
    async (postId) => {
      if (!viewerActorId || identityLoading || !postId) return;

      try {
        await sendPhotoRoseController({
          postId,
          actorId: viewerActorId,
          qty: 1,
        });

        await load();
      } catch (err) {
        console.error("[usePhotoReactions] sendRose failed", err);
        setError(err);
      }
    },
    [viewerActorId, identityLoading, load]
  );

  return {
    enriched,
    loading: loading || identityLoading,
    error,
    toggleReaction,
    sendRose,
    reload: load,
  };
}
