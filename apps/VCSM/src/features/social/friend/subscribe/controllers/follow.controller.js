import {
  dalInsertFollow,
} from '@/features/social/friend/request/dal/actorFollows.dal'
import { ctrlGetFollowRelationshipState } from '@/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller'
import { ctrlSendFollowRequest } from '@/features/social/friend/request/controllers/followRequests.controller'
import { FOLLOW_RELATION_STATES } from '@/features/social/friend/subscribe/model/followRelationState.model'
import { publishVcsmNotification } from '@/features/notifications/adapters/notifications.adapter'
import { invalidateFollowerCount } from '@/features/social/friend/subscribe/dal/subscriberCount.dal'
import { invalidateFeedFollowCache } from '@/features/CentralFeed/adapters/feedCache.adapter'
import { ctrlGetBlockStatus } from '@/features/block'

export async function ctrlSubscribe({
  followerActorId,
  followedActorId,
  assertingActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

  if (followerActorId === followedActorId) {
    throw new Error('Cannot follow yourself')
  }

  // 🔒 OWNERSHIP GATE (V-SUB-001): session actor must match claimed follower
  if (!assertingActorId || assertingActorId !== followerActorId) {
    throw new Error('session actor does not match follower')
  }

  const { isBlocked } = await ctrlGetBlockStatus({
    actorId: followerActorId,
    targetActorId: followedActorId,
  })
  if (isBlocked) {
    throw new Error('Cannot follow a blocked actor')
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

  if (relation.followPolicy === 'closed') {
    throw new Error('Actor does not accept new followers')
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
  // Bust feed follow cache so private posts from this actor become visible immediately
  invalidateFeedFollowCache(followerActorId)

  publishVcsmNotification({
    recipientActorId: followedActorId,
    actorId: followerActorId,
    kind: 'follow',
    objectType: 'actor',
    objectId: followerActorId,
    linkPath: `/feed`,
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

