import { ctrlGetFollowRequestStatus } from "@/features/social/friend/request/controllers/followRequests.controller";
import { ctrlGetFollowStatus } from "@/features/social/friend/subscribe/controllers/getFollowStatus.controller";
import { dalGetActorSocialPublicPolicy } from "@/features/social/privacy/dal/actorSocialPublicPolicy.dal";
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
      followPolicy: 'approval_required',
      isPrivate: true,
      isFollowing: false,
      requestStatus: null,
    };
  }

  const [policy, isFollowing, requestStatus] = await Promise.all([
    dalGetActorSocialPublicPolicy(targetActorId),
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
    followPolicy: policy.followPolicy,
    isPrivate: policy.followPolicy !== 'open',
    isFollowing: Boolean(isFollowing),
    requestStatus: requestStatus ?? null,
  };
}

