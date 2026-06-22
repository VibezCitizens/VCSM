// src/features/social/friend/request/controllers/followRequests.controller.js

import {
  dalGetRequestStatus,
  dalUpsertPendingRequest,
  dalUpdateRequestStatus,
  dalListIncomingPendingRequests,
} from '../dal/followRequests.dal'

import { dalInsertFollow } from '@/features/social/friend/request/dal/actorFollows.dal'
import { publishVcsmNotification } from '@/features/notifications/adapters/notifications.adapter'
import { ctrlGetBlockStatus } from '@/features/block'
import { invalidateFeedFollowCache } from '@/features/CentralFeed/adapters/feedCache.adapter'

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

  const { isBlocked } = await ctrlGetBlockStatus({
    actorId: requesterActorId,
    targetActorId,
  })
  if (isBlocked) {
    throw new Error('Cannot send follow request to a blocked actor')
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

  // Publish follow_request notification through engine (replaces DB trigger path)
  publishVcsmNotification({
    recipientActorId: targetActorId,
    actorId: requesterActorId,
    kind: 'follow_request',
    objectType: 'actor',
    objectId: requesterActorId,
    linkPath: `/feed`,
    context: {},
  })

  return 'pending'
}

export async function ctrlAcceptFollowRequest({
  requesterActorId,
  targetActorId,
  assertingActorId,
}) {
  if (!requesterActorId || !targetActorId) {
    throw new Error('ctrlAcceptFollowRequest: missing actor ids')
  }
  if (!assertingActorId || assertingActorId !== targetActorId) {
    throw new Error('ctrlAcceptFollowRequest: session actor does not own this request')
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

  // Bust follow caches for both actors so the new relationship is visible immediately
  invalidateFeedFollowCache(requesterActorId)
  invalidateFeedFollowCache(targetActorId)

  // Publish follow_request_accepted notification through engine (replaces DB trigger path)
  publishVcsmNotification({
    recipientActorId: requesterActorId,
    actorId: targetActorId,
    kind: 'follow_request_accepted',
    objectType: 'actor',
    objectId: targetActorId,
    linkPath: `/feed`,
    context: {},
  })

  return true
}

export async function ctrlDeclineFollowRequest({
  requesterActorId,
  targetActorId,
  assertingActorId,
}) {
  if (!requesterActorId || !targetActorId) {
    throw new Error('ctrlDeclineFollowRequest: missing actor ids')
  }
  if (!assertingActorId || assertingActorId !== targetActorId) {
    throw new Error('ctrlDeclineFollowRequest: session actor does not own this request')
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

export async function ctrlCancelFollowRequest({
  requesterActorId,
  targetActorId,
  assertingActorId,
}) {
  if (!requesterActorId || !targetActorId) {
    throw new Error('ctrlCancelFollowRequest: missing actor ids')
  }
  if (!assertingActorId || assertingActorId !== requesterActorId) {
    throw new Error('ctrlCancelFollowRequest: session actor does not own this request')
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
    status: 'cancelled',
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
  assertingActorId,
}) {
  if (!targetActorId) return []

  // 🔒 OWNERSHIP GATE (V-SUB-003): session actor must own this inbox.
  if (!assertingActorId || assertingActorId !== targetActorId) {
    throw new Error('session actor does not own this inbox')
  }

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
