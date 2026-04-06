import { ctrlGetFollowRequestStatus } from "@/features/social/friend/request/controllers/followRequests.controller";
import { ctrlGetFollowStatus } from "@/features/social/friend/subscribe/controllers/getFollowStatus.controller";
import { ctrlGetActorPrivacy } from "@/features/social/privacy/controllers/getActorPrivacy.controller";
import {
  FOLLOW_RELATION_STATES,
  resolveFollowRelationStateModel,
} from "@/features/social/friend/subscribe/model/followRelationState.model";

export async function ctrlGetFollowRelationshipState({
  requesterActorId,
  targetActorId,
} = {}) {
  if (!requesterActorId || !targetActorId || requesterActorId === targetActorId) {
    return {
      state: FOLLOW_RELATION_STATES.NOT_FOLLOWING,
      isPrivate: false,
      isFollowing: false,
      requestStatus: null,
    };
  }

  const [{ isPrivate }, isFollowing, requestStatus] = await Promise.all([
    ctrlGetActorPrivacy({ actorId: targetActorId }),
    ctrlGetFollowStatus({
      followerActorId: requesterActorId,
      followedActorId: targetActorId,
    }),
    ctrlGetFollowRequestStatus({
      requesterActorId,
      targetActorId,
    }),
  ]);

  const state = resolveFollowRelationStateModel({
    isFollowing,
    requestStatus,
  });

  return {
    state,
    isPrivate: Boolean(isPrivate),
    isFollowing: Boolean(isFollowing),
    requestStatus: requestStatus ?? null,
  };
}

