import {
  dalInsertFollow,
  dalDeactivateFollow,
} from '@/features/social/friend/request/dal/actorFollows.dal'
import { ctrlGetFollowRelationshipState } from '@/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller'
import { ctrlSendFollowRequest } from '@/features/social/friend/request/controllers/followRequests.controller'
import { FOLLOW_RELATION_STATES } from '@/features/social/friend/subscribe/model/followRelationState.model'
import { publishVcsmNotification } from '@/features/notifications/publish'
import { invalidateFollowerCount } from '@/features/social/friend/subscribe/dal/subscriberCount.dal'

export async function ctrlSubscribe({
  followerActorId,
  followedActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

  if (followerActorId === followedActorId) {
    throw new Error('Cannot follow yourself')
  }

  const relation = await ctrlGetFollowRelationshipState({
    requesterActorId: followerActorId,
    targetActorId: followedActorId,
  })

  if (relation.state === FOLLOW_RELATION_STATES.FOLLOWING) {
    return {
      ok: true,
      mode: 'follow',
      status: 'following',
      isFollowing: true,
      decision: {
        route: 'already_following',
        relation,
      },
    }
  }

  if (relation.isPrivate) {
    const requestStatus = await ctrlSendFollowRequest({
      requesterActorId: followerActorId,
      targetActorId: followedActorId,
    })

    return {
      ok: true,
      mode: 'request',
      status: requestStatus === 'accepted' ? 'following' : 'pending',
      isFollowing: requestStatus === 'accepted',
      decision: {
        route: 'private_request',
        relation,
      },
    }
  }

  try {
    await dalInsertFollow({
      followerActorId,
      followedActorId,
    })
  } catch (error) {
    error.followDecision = {
      route: 'public_follow',
      relation,
      followerActorId,
      followedActorId,
    }
    throw error
  }

  invalidateFollowerCount(followedActorId)

  // Publish follow notification through engine (replaces DB trigger path)
  publishVcsmNotification({
    recipientActorId: followedActorId,
    actorId: followerActorId,
    kind: 'follow',
    objectType: 'actor',
    objectId: followerActorId,
    linkPath: `/profile/${followerActorId}`,
    context: {},
  })

  return {
    ok: true,
    mode: 'follow',
    status: 'following',
    isFollowing: true,
    decision: {
      route: 'public_follow',
      relation,
    },
  }
}

export async function ctrlUnsubscribe({
  followerActorId,
  followedActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

  if (followerActorId === followedActorId) {
    throw new Error('Cannot unsubscribe from yourself')
  }

  await dalDeactivateFollow({
    followerActorId,
    followedActorId,
  })

  invalidateFollowerCount(followedActorId)

  return true
}
