// src/features/social/friend/request/controllers/followRequests.controller.js

import {
  dalGetRequestStatus,
  dalUpsertPendingRequest,
  dalUpdateRequestStatus,
  dalListIncomingPendingRequests,
} from '../dal/followRequests.dal'

import { dalInsertFollow } from '@/features/social/friend/request/dal/actorFollows.dal'

/**
 * ============================================================
 * Controller — Follow Requests
 * ------------------------------------------------------------
 * Owns business meaning & idempotency
 * ============================================================
 */

export async function ctrlSendFollowRequest({
  requesterActorId,
  targetActorId,
}) {
  if (!requesterActorId || !targetActorId) {
    throw new Error('Missing actor ids')
  }

  if (requesterActorId === targetActorId) {
    throw new Error('Cannot follow yourself')
  }

  const existing = await dalGetRequestStatus({
    requesterActorId,
    targetActorId,
  })

  if (existing === 'pending') return 'pending'
  if (existing === 'accepted') return 'accepted'

  await dalUpsertPendingRequest({
    requesterActorId,
    targetActorId,
  })

  return 'pending'
}

export async function ctrlAcceptFollowRequest({
  requesterActorId,
  targetActorId,
}) {
  if (!requesterActorId || !targetActorId) {
    throw new Error(
      'ctrlAcceptFollowRequest: missing actor ids'
    )
  }

  const status = await dalGetRequestStatus({
    requesterActorId,
    targetActorId,
  })

  if (status !== 'pending') {
    return false
  }

  await dalInsertFollow({
    followerActorId: requesterActorId,
    followedActorId: targetActorId,
  })

  await dalUpdateRequestStatus({
    requesterActorId,
    targetActorId,
    status: 'accepted',
  })

  return true
}


export async function ctrlDeclineFollowRequest({
  requesterActorId,
  targetActorId,
}) {
  if (!requesterActorId || !targetActorId) {
    throw new Error(
      'ctrlDeclineFollowRequest: missing actor ids'
    )
  }

  const status = await dalGetRequestStatus({
    requesterActorId,
    targetActorId,
  })

  if (status !== 'pending') {
    return false
  }

  await dalUpdateRequestStatus({
    requesterActorId,
    targetActorId,
    status: 'declined',
  })

  return true
}


/**
 * ============================================================
 * Incoming requests (TARGET actor)
 * Used by Settings → Privacy
 * ============================================================
 */
export async function ctrlListIncomingRequests({
  targetActorId,
}) {
  if (!targetActorId) return []

  return dalListIncomingPendingRequests({
    targetActorId,
  })
}

/**
 * ============================================================
 * Thin controller for hooks (status checks)
 * ============================================================
 */
export async function ctrlGetFollowRequestStatus({
  requesterActorId,
  targetActorId,
}) {
  return dalGetRequestStatus({
    requesterActorId,
    targetActorId,
  })
}
