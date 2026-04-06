import { useCallback } from "react";
import { ctrlSubscribe } from "@/features/social/friend/subscribe/controllers/follow.controller";
import { ctrlUnsubscribe } from "@/features/social/friend/subscribe/controllers/unsubscribe.controller";
import { ctrlCancelFollowRequest } from "@/features/social/friend/request/controllers/followRequests.controller";
import { FOLLOW_RELATION_STATES } from "@/features/social/friend/subscribe/model/followRelationState.model";

export function useFollowActorToggle() {
  return useCallback(async ({ followerActorId, followedActorId, isFollowing, state }) => {
    if (!followerActorId || !followedActorId) {
      throw new Error("Missing actor ids");
    }
    if (followerActorId === followedActorId) {
      throw new Error("Cannot follow yourself");
    }

    const relationState = state ?? (isFollowing ? FOLLOW_RELATION_STATES.FOLLOWING : FOLLOW_RELATION_STATES.NOT_FOLLOWING);

    if (relationState === FOLLOW_RELATION_STATES.FOLLOWING) {
      await ctrlUnsubscribe({ followerActorId, followedActorId });
      return {
        isFollowing: false,
        status: FOLLOW_RELATION_STATES.NOT_FOLLOWING,
        mode: "unfollow",
      };
    }

    if (relationState === FOLLOW_RELATION_STATES.REQUEST_PENDING) {
      await ctrlCancelFollowRequest({
        requesterActorId: followerActorId,
        targetActorId: followedActorId,
      });
      return {
        isFollowing: false,
        status: FOLLOW_RELATION_STATES.NOT_FOLLOWING,
        mode: "cancel_request",
      };
    }

    const result = await ctrlSubscribe({ followerActorId, followedActorId });
    return {
      isFollowing: Boolean(result?.isFollowing),
      status: result?.status ?? FOLLOW_RELATION_STATES.FOLLOWING,
      mode: result?.mode ?? "follow",
    };
  }, []);
}
