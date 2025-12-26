// src/features/social/friend/subscribe/controllers/unsubscribe.controller.js

import { dalDeactivateFollow } from '@/features/social/friend/request/dal/actorFollows.dal'
import { dalUpdateRequestStatus } from '@/features/social/friend/request/dal/followRequests.dal'

export async function ctrlUnsubscribe({
  followerActorId,
  followedActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

  // 1️⃣ Deactivate follow edge (history preserved)
  await dalDeactivateFollow({
    followerActorId,
    followedActorId,
  })

  // 2️⃣ Revoke accepted follow request (history preserved)
  await dalUpdateRequestStatus({
    requesterActorId: followerActorId,
    targetActorId: followedActorId,
    status: 'revoked',
  })

  return true
}
