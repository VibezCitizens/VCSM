// src/features/social/friend/subscribe/controllers/unsubscribe.controller.js

import { dalDeactivateFollow } from '@/features/social/friend/request/dal/actorFollows.dal'
import { dalUpdateRequestStatus } from '@/features/social/friend/request/dal/followRequests.dal'
import { invalidateFollowerCount } from '@/features/social/friend/subscribe/dal/subscriberCount.dal'
import { invalidateFeedFollowCache } from '@/features/feed/adapters/feedCache.adapter'

export async function ctrlUnsubscribe({
  followerActorId,
  followedActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

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
