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
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'
import { readSocialActorOwnerLinkDAL } from '@/features/social/friend/request/dal/socialActorOwnership.read.dal'

// 🔒 OWNERSHIP GATE (V06B-M1): session-derived, kind-agnostic owner-bind on the
// acting actor. Mirrors createPostController; vc.actor_owners is the canonical
// authority (a session user owns user-kind AND vport-kind actors). DiD only; the
// durable boundary is vc.social_follow_requests / vc.actor_follows RLS (Phase 15).
async function assertSessionOwnsActingActor(actingActorId, ctrlName) {
  const user = await readCurrentAuthUser()
  if (!user) throw new Error(`${ctrlName}: not authenticated`)
  const owner = await readSocialActorOwnerLinkDAL({ actorId: actingActorId, userId: user.id })
  if (!owner) throw new Error(`${ctrlName}: actor not owned by session user`)
}

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

  // 🔒 V06B-M1: bind the acting actor (requester). Closes the previously ungated
  // send path; assertingActorId is intentionally not added (no signature change).
  await assertSessionOwnsActingActor(requesterActorId, 'ctrlSendFollowRequest')

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
  // assertingActorId retained (vestigial) for API compatibility — presence contract
  // preserved (the prior gate also threw when it was absent); authorization is the
  // session bind below.
  if (!assertingActorId) {
    throw new Error('ctrlAcceptFollowRequest: assertingActorId required')
  }
  // 🔒 V06B-M1: bind the acting actor (inbox owner = targetActorId).
  await assertSessionOwnsActingActor(targetActorId, 'ctrlAcceptFollowRequest')

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
  // assertingActorId retained (vestigial) for API compatibility — presence contract
  // preserved; authorization is the session bind below.
  if (!assertingActorId) {
    throw new Error('ctrlDeclineFollowRequest: assertingActorId required')
  }
  // 🔒 V06B-M1: bind the acting actor (inbox owner = targetActorId).
  await assertSessionOwnsActingActor(targetActorId, 'ctrlDeclineFollowRequest')

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
  // assertingActorId retained (vestigial) for API compatibility — presence contract
  // preserved; authorization is the session bind below.
  if (!assertingActorId) {
    throw new Error('ctrlCancelFollowRequest: assertingActorId required')
  }
  // 🔒 V06B-M1: bind the acting actor (requester).
  await assertSessionOwnsActingActor(requesterActorId, 'ctrlCancelFollowRequest')

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

  // assertingActorId retained (vestigial) for API compatibility — presence contract
  // preserved (the prior gate also threw when it was absent).
  if (!assertingActorId) {
    throw new Error('ctrlListIncomingRequests: assertingActorId required')
  }
  // 🔒 OWNERSHIP GATE (V06B-M1): session-derived owner-bind on the inbox owner
  // (targetActorId). Replaces the prior caller-equality check.
  await assertSessionOwnsActingActor(targetActorId, 'ctrlListIncomingRequests')

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
