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
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'
import { readSocialActorOwnerLinkDAL } from '@/features/social/friend/request/dal/socialActorOwnership.read.dal'

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

  // assertingActorId retained (vestigial) for API compatibility — no longer drives
  // authorization, but its presence contract is preserved (the prior gate also threw
  // when it was absent).
  if (!assertingActorId) {
    throw new Error('ctrlSubscribe: assertingActorId required')
  }

  // 🔒 OWNERSHIP GATE (V06B-M1): session-derived, kind-agnostic owner-bind on the
  // acting actor (the follower). Replaces the prior caller-equality check (which was
  // vacuous on the toggle path, where assertingActorId === followerActorId). Mirrors
  // createPostController; vc.actor_owners is the canonical authority. DiD only; the
  // durable boundary is vc.actor_follows RLS (Phase 15). assertingActorId retained
  // (vestigial) for API compatibility.
  const user = await readCurrentAuthUser()
  if (!user) throw new Error('ctrlSubscribe: not authenticated')
  const owner = await readSocialActorOwnerLinkDAL({ actorId: followerActorId, userId: user.id })
  if (!owner) throw new Error('ctrlSubscribe: actor not owned by session user')

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

