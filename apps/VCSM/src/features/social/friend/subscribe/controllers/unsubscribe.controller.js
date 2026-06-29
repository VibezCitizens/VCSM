// src/features/social/friend/subscribe/controllers/unsubscribe.controller.js

import { dalDeactivateFollow } from '@/features/social/friend/request/dal/actorFollows.dal'
import { dalUpdateRequestStatus } from '@/features/social/friend/request/dal/followRequests.dal'
import { invalidateFollowerCount } from '@/features/social/friend/subscribe/dal/subscriberCount.dal'
import { invalidateFeedFollowCache } from '@/features/CentralFeed/adapters/feedCache.adapter'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'
import { readSocialActorOwnerLinkDAL } from '@/features/social/friend/request/dal/socialActorOwnership.read.dal'

export async function ctrlUnsubscribe({
  followerActorId,
  followedActorId,
  assertingActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

  // assertingActorId retained (vestigial) for API compatibility — no longer drives
  // authorization, but its presence contract is preserved (the prior gate also threw
  // when it was absent).
  if (!assertingActorId) {
    throw new Error('ctrlUnsubscribe: assertingActorId required')
  }

  // 🔒 OWNERSHIP GATE (V06B-M1): session-derived, kind-agnostic owner-bind on the
  // acting actor (the follower). Replaces the prior caller-equality check (vacuous on
  // the toggle path). Privacy-critical: prevents forcing invalidateFeedFollowCache on
  // a victim's actorId. DiD only; durable boundary = vc.actor_follows RLS (Phase 15).
  // assertingActorId retained (vestigial) for API compatibility.
  const user = await readCurrentAuthUser()
  if (!user) throw new Error('ctrlUnsubscribe: not authenticated')
  const owner = await readSocialActorOwnerLinkDAL({ actorId: followerActorId, userId: user.id })
  if (!owner) throw new Error('ctrlUnsubscribe: actor not owned by session user')

  // Both writes are independent — run in parallel to save one round-trip
  await Promise.all([
    dalDeactivateFollow({ followerActorId, followedActorId }),
    dalUpdateRequestStatus({
      requesterActorId: followerActorId,
      targetActorId: followedActorId,
      status: 'revoked',
    }),
  ])

  invalidateFollowerCount(followedActorId)
  // Privacy-critical: revoke access to private posts immediately on unfollow
  invalidateFeedFollowCache(followerActorId)

  return true
}
