import { useCallback, useEffect, useState } from "react";
import { ctrlGetFollowRelationshipState } from "@/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller";
import { FOLLOW_RELATION_STATES } from "@/features/social/friend/subscribe/model/followRelationState.model";

const EMPTY = Object.freeze({
  state: FOLLOW_RELATION_STATES.NOT_FOLLOWING,
  isPrivate: false,
  isFollowing: false,
  requestStatus: null,
});

export function useFollowRelationshipState({
  requesterActorId,
  targetActorId,
} = {}) {
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(EMPTY);

  const refresh = useCallback(async () => {
    if (!requesterActorId || !targetActorId || requesterActorId === targetActorId) {
      setValue(EMPTY);
      return EMPTY;
    }

    setLoading(true);
    try {
      const next = await ctrlGetFollowRelationshipState({
        requesterActorId,
        targetActorId,
      });
      setValue(next ?? EMPTY);
      return next ?? EMPTY;
    } catch (error) {
      console.error("[useFollowRelationshipState] failed", error);
      setValue(EMPTY);
      return EMPTY;
    } finally {
      setLoading(false);
    }
  }, [requesterActorId, targetActorId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const next = await refresh();
      if (!alive) return;
      setValue(next ?? EMPTY);
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  return {
    loading,
    ...value,
    refresh,
  };
}

