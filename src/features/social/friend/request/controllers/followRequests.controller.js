// src/features/social/friend/request/controllers/followRequests.controller.js

import {
  dalGetRequestStatus,
  dalUpsertPendingRequest,
  dalUpdateRequestStatus,
  dalListIncomingPendingRequests,
} from '../dal/followRequests.dal'

import { dalInsertFollow } from '@/features/social/friend/request/dal/actorFollows.dal'
import { dalInsertNotification } from '@/features/notifications/inbox/dal/notifications.create.dal'

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

  try {
    await dalInsertNotification({
      recipientActorId: targetActorId,
      actorId: requesterActorId,
      kind: 'follow_request',
      objectType: 'actor',
      objectId: requesterActorId,
      linkPath: `/profile/${requesterActorId}`,
      context: {
        requesterActorId,
        targetActorId,
      },
    })
  } catch (error) {
    console.error('[ctrlSendFollowRequest] notification insert failed', error)
  }

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

  try {
    await dalInsertNotification({
      recipientActorId: requesterActorId,
      actorId: targetActorId,
      kind: 'follow_request_accepted',
      objectType: 'actor',
      objectId: targetActorId,
      linkPath: `/profile/${targetActorId}`,
      context: {
        requesterActorId,
        targetActorId,
      },
    })
  } catch (error) {
    console.error('[ctrlAcceptFollowRequest] notification insert failed', error)
  }

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
