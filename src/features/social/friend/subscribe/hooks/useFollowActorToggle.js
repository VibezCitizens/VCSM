import { useCallback } from "react";
import { ctrlSubscribe } from "@/features/social/friend/subscribe/controllers/follow.controller";
import { ctrlUnsubscribe } from "@/features/social/friend/subscribe/controllers/unsubscribe.controller";

export function useFollowActorToggle() {
  return useCallback(async ({ followerActorId, followedActorId, isFollowing }) => {
    if (!followerActorId || !followedActorId) {
      throw new Error("Missing actor ids");
    }
    if (followerActorId === followedActorId) {
      throw new Error("Cannot follow yourself");
    }

    if (isFollowing) {
      await ctrlUnsubscribe({ followerActorId, followedActorId });
      return { isFollowing: false };
    }

    await ctrlSubscribe({ followerActorId, followedActorId });
    return { isFollowing: true };
  }, []);
}
