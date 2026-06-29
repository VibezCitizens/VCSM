/**
 * Regression tests — followRequests.controller
 * (ctrlAcceptFollowRequest, ctrlDeclineFollowRequest, ctrlCancelFollowRequest,
 *  ctrlListIncomingRequests, ctrlSendFollowRequest)
 *
 * Security invariants (VENOM V-SUB-003, V-SUB-005 / SPIDER-MAN):
 *
 * EXISTING CORRECT BEHAVIOR (assertingActorId gate — should already pass):
 *   ctrlAcceptFollowRequest, ctrlDeclineFollowRequest, ctrlCancelFollowRequest
 *   all verify assertingActorId before any DB write. These tests lock that behavior.
 *
 * V-SUB-003 (HIGH — missing ownership gate):
 *   ctrlListIncomingRequests has no ownership check. Any actor can read any
 *   actor's incoming follow request inbox by passing their targetActorId.
 *   ⚠️  Tests in the "[V-SUB-003 REGRESSION]" block WILL FAIL until
 *       assertingActorId is added to ctrlListIncomingRequests.
 *
 * Run: npx vitest run src/features/social/friend/request/controllers/__tests__/followRequests.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/social/friend/request/dal/followRequests.dal', () => ({
  dalGetRequestStatus:           vi.fn(),
  dalUpsertPendingRequest:       vi.fn(),
  dalUpdateRequestStatus:        vi.fn(),
  dalListIncomingPendingRequests: vi.fn(),
}))

vi.mock('@/features/social/friend/request/dal/actorFollows.dal', () => ({
  dalInsertFollow: vi.fn(),
}))

vi.mock('@/features/notifications/adapters/notifications.adapter', () => ({
  publishVcsmNotification: vi.fn(),
}))

vi.mock('@/features/block', () => ({
  ctrlGetBlockStatus: vi.fn(),
}))

vi.mock('@/features/CentralFeed/adapters/feedCache.adapter', () => ({
  invalidateFeedFollowCache: vi.fn(),
}))

vi.mock('@/features/auth/adapters/authSession.adapter', () => ({ readCurrentAuthUser: vi.fn() }))
vi.mock('@/features/social/friend/request/dal/socialActorOwnership.read.dal', () => ({
  readSocialActorOwnerLinkDAL: vi.fn(),
}))

import {
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
  ctrlCancelFollowRequest,
  ctrlListIncomingRequests,
  ctrlSendFollowRequest,
} from '../followRequests.controller'

import {
  dalGetRequestStatus,
  dalUpsertPendingRequest,
  dalUpdateRequestStatus,
  dalListIncomingPendingRequests,
} from '@/features/social/friend/request/dal/followRequests.dal'

import { dalInsertFollow } from '@/features/social/friend/request/dal/actorFollows.dal'
import { publishVcsmNotification } from '@/features/notifications/adapters/notifications.adapter'
import { ctrlGetBlockStatus } from '@/features/block'
import { invalidateFeedFollowCache } from '@/features/CentralFeed/adapters/feedCache.adapter'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'
import { readSocialActorOwnerLinkDAL } from '@/features/social/friend/request/dal/socialActorOwnership.read.dal'

// ─── fixtures ─────────────────────────────────────────────────────────────────

const USER      = 'user-session-111'
const REQUESTER = 'actor-requester-aaa-111'
const TARGET    = 'actor-target-bbb-222'

// V06B-M1: grant session ownership of the acting actor (kind-agnostic). The acting
// actor differs per controller (target/inbox for accept/decline/list, requester for
// cancel/send); the granted link is returned regardless of which actorId is read.
function grantSession() {
  readCurrentAuthUser.mockResolvedValue({ id: USER })
  readSocialActorOwnerLinkDAL.mockResolvedValue({ actor_id: 'owned', is_void: false })
}
function denyOwnership() {
  readCurrentAuthUser.mockResolvedValue({ id: USER })
  readSocialActorOwnerLinkDAL.mockResolvedValue(null)
}

// ─── ctrlAcceptFollowRequest — assertingActorId gate (existing, must not regress) ──

describe('ctrlAcceptFollowRequest — [V06B-M1] session-derived ownership gate (inbox = targetActorId)', () => {
  beforeEach(() => { vi.clearAllMocks(); grantSession() })

  it('throws when unauthenticated (no session user)', async () => {
    readCurrentAuthUser.mockResolvedValue(null)
    await expect(
      ctrlAcceptFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow('not authenticated')
  })

  it('throws when the session does not own targetActorId (inbox)', async () => {
    denyOwnership()
    await expect(
      ctrlAcceptFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow('actor not owned by session user')
  })

  it('binds ownership on the target (inbox) actor', async () => {
    dalGetRequestStatus.mockResolvedValue('pending')
    dalInsertFollow.mockResolvedValue(true)
    dalUpdateRequestStatus.mockResolvedValue(true)
    await ctrlAcceptFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: TARGET })
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: TARGET, userId: USER })
  })

  it('does not call dalGetRequestStatus when ownership gate rejects', async () => {
    denyOwnership()
    await expect(
      ctrlAcceptFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow()
    expect(dalGetRequestStatus).not.toHaveBeenCalled()
  })

  it('does not call dalInsertFollow when ownership gate rejects', async () => {
    denyOwnership()
    await expect(
      ctrlAcceptFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow()
    expect(dalInsertFollow).not.toHaveBeenCalled()
  })

  it('proceeds when the session owns targetActorId', async () => {
    dalGetRequestStatus.mockResolvedValue('pending')
    dalInsertFollow.mockResolvedValue(true)
    dalUpdateRequestStatus.mockResolvedValue(true)
    const result = await ctrlAcceptFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: TARGET,
    })
    expect(result).toBe(true)
  })

  it('returns false when request is not pending', async () => {
    dalGetRequestStatus.mockResolvedValue(null)
    const result = await ctrlAcceptFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: TARGET,
    })
    expect(result).toBe(false)
  })
})

// ─── ctrlAcceptFollowRequest — accepted flow ──────────────────────────────────

describe('ctrlAcceptFollowRequest — successful accept: DAL + cache + notification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    grantSession()
    dalGetRequestStatus.mockResolvedValue('pending')
    dalInsertFollow.mockResolvedValue(true)
    dalUpdateRequestStatus.mockResolvedValue(true)
  })

  it('calls dalInsertFollow to activate the follow relationship', async () => {
    await ctrlAcceptFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: TARGET,
    })
    expect(dalInsertFollow).toHaveBeenCalledWith({
      followerActorId: REQUESTER,
      followedActorId: TARGET,
    })
  })

  it('calls dalUpdateRequestStatus with status: accepted', async () => {
    await ctrlAcceptFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: TARGET,
    })
    expect(dalUpdateRequestStatus).toHaveBeenCalledWith({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      status: 'accepted',
    })
  })

  it('busts feed cache for both requester and target', async () => {
    await ctrlAcceptFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: TARGET,
    })
    expect(invalidateFeedFollowCache).toHaveBeenCalledWith(REQUESTER)
    expect(invalidateFeedFollowCache).toHaveBeenCalledWith(TARGET)
  })

  it('calls publishVcsmNotification to notify the requester', async () => {
    await ctrlAcceptFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: TARGET,
    })
    expect(publishVcsmNotification).toHaveBeenCalledTimes(1)
    const [notif] = publishVcsmNotification.mock.calls[0]
    expect(notif.recipientActorId).toBe(REQUESTER)
    expect(notif.kind).toBe('follow_request_accepted')
  })
})

// ─── ctrlDeclineFollowRequest — assertingActorId gate ────────────────────────

describe('ctrlDeclineFollowRequest — [V06B-M1] session-derived ownership gate (inbox = targetActorId)', () => {
  beforeEach(() => { vi.clearAllMocks(); grantSession() })

  it('throws when the session does not own targetActorId (inbox)', async () => {
    denyOwnership()
    await expect(
      ctrlDeclineFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: TARGET,
      })
    ).rejects.toThrow('actor not owned by session user')
  })

  it('does not call dalUpdateRequestStatus when ownership gate rejects', async () => {
    denyOwnership()
    await expect(
      ctrlDeclineFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: TARGET,
      })
    ).rejects.toThrow()
    expect(dalUpdateRequestStatus).not.toHaveBeenCalled()
  })

  it('proceeds and returns true when the session owns targetActorId', async () => {
    dalGetRequestStatus.mockResolvedValue('pending')
    dalUpdateRequestStatus.mockResolvedValue(true)
    const result = await ctrlDeclineFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: TARGET,
    })
    expect(result).toBe(true)
  })

  it('writes status: declined on successful decline', async () => {
    grantSession()
    dalGetRequestStatus.mockResolvedValue('pending')
    dalUpdateRequestStatus.mockResolvedValue(true)
    await ctrlDeclineFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: TARGET,
    })
    expect(dalUpdateRequestStatus).toHaveBeenCalledWith({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      status: 'declined',
    })
  })
})

// ─── ctrlCancelFollowRequest — assertingActorId gate ─────────────────────────

describe('ctrlCancelFollowRequest — [V06B-M1] session-derived ownership gate (requesterActorId)', () => {
  beforeEach(() => { vi.clearAllMocks(); grantSession() })

  it('throws when the session does not own requesterActorId', async () => {
    denyOwnership()
    await expect(
      ctrlCancelFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: REQUESTER,
      })
    ).rejects.toThrow('actor not owned by session user')
  })

  it('binds ownership on the requester actor', async () => {
    dalGetRequestStatus.mockResolvedValue('pending')
    dalUpdateRequestStatus.mockResolvedValue(true)
    await ctrlCancelFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: REQUESTER })
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: REQUESTER, userId: USER })
  })

  it('does not call dalUpdateRequestStatus when ownership gate rejects', async () => {
    denyOwnership()
    await expect(
      ctrlCancelFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: REQUESTER,
      })
    ).rejects.toThrow()
    expect(dalUpdateRequestStatus).not.toHaveBeenCalled()
  })

  it('proceeds when the session owns requesterActorId', async () => {
    dalGetRequestStatus.mockResolvedValue('pending')
    dalUpdateRequestStatus.mockResolvedValue(true)
    const result = await ctrlCancelFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: REQUESTER,
    })
    expect(result).toBe(true)
  })

  it('writes status: cancelled on successful cancel', async () => {
    dalGetRequestStatus.mockResolvedValue('pending')
    dalUpdateRequestStatus.mockResolvedValue(true)
    await ctrlCancelFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      assertingActorId: REQUESTER,
    })
    expect(dalUpdateRequestStatus).toHaveBeenCalledWith({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
      status: 'cancelled',
    })
  })
})

// ─── [V-SUB-003 REGRESSION] ctrlListIncomingRequests — ownership gate ────────
// ⚠️  These tests WILL FAIL until assertingActorId is added to ctrlListIncomingRequests.
// Any actor can currently read any actor's incoming follow request inbox by
// supplying their targetActorId — no session ownership verification is performed.
// Tracking: VENOM V-SUB-003 / HIGH / BLOCKED 2026-05-27

describe('ctrlListIncomingRequests — [V06B-M1] session-derived ownership gate (inbox = targetActorId)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    grantSession()
    dalListIncomingPendingRequests.mockResolvedValue([])
  })

  it('throws when unauthenticated (no session user)', async () => {
    readCurrentAuthUser.mockResolvedValue(null)
    await expect(
      ctrlListIncomingRequests({ targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow('not authenticated')
  })

  it('throws when the session does not own the inbox (targetActorId)', async () => {
    denyOwnership()
    await expect(
      ctrlListIncomingRequests({ targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow('actor not owned by session user')
  })

  it('does not call dalListIncomingPendingRequests when ownership gate rejects', async () => {
    denyOwnership()
    await expect(
      ctrlListIncomingRequests({ targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow()
    expect(dalListIncomingPendingRequests).not.toHaveBeenCalled()
  })

  it('proceeds when the session owns the inbox (authentic owner)', async () => {
    dalListIncomingPendingRequests.mockResolvedValue([
      { requester_actor_id: REQUESTER, target_actor_id: TARGET, status: 'pending' },
    ])
    const result = await ctrlListIncomingRequests({ targetActorId: TARGET, assertingActorId: TARGET })
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: TARGET, userId: USER })
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
  })
})

// ─── ctrlListIncomingRequests — existing behavior ────────────────────────────

describe('ctrlListIncomingRequests — guard and DAL forwarding', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns empty array when targetActorId is falsy', async () => {
    const result = await ctrlListIncomingRequests({ targetActorId: null })
    expect(result).toEqual([])
    expect(dalListIncomingPendingRequests).not.toHaveBeenCalled()
  })
})

// ─── ctrlSendFollowRequest — guards ──────────────────────────────────────────

describe('ctrlSendFollowRequest — guard: missing actor ids', () => {
  beforeEach(() => { vi.clearAllMocks(); grantSession() })

  it('throws when requesterActorId is missing', async () => {
    await expect(
      ctrlSendFollowRequest({ requesterActorId: null, targetActorId: TARGET })
    ).rejects.toThrow('Missing actor ids')
  })

  it('throws when targetActorId is missing', async () => {
    await expect(
      ctrlSendFollowRequest({ requesterActorId: REQUESTER, targetActorId: null })
    ).rejects.toThrow('Missing actor ids')
  })

  it('throws on self-request', async () => {
    await expect(
      ctrlSendFollowRequest({ requesterActorId: REQUESTER, targetActorId: REQUESTER })
    ).rejects.toThrow('Cannot follow yourself')
  })

  it('throws when target is blocked', async () => {
    ctrlGetBlockStatus.mockResolvedValue({ isBlocked: true })
    await expect(
      ctrlSendFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET })
    ).rejects.toThrow('Cannot send follow request to a blocked actor')
  })
})

describe('ctrlSendFollowRequest — [V06B-M1] session-derived ownership gate (requesterActorId; previously ungated)', () => {
  beforeEach(() => { vi.clearAllMocks(); grantSession(); ctrlGetBlockStatus.mockResolvedValue({ isBlocked: false }) })

  it('throws when the session does not own requesterActorId', async () => {
    denyOwnership()
    await expect(
      ctrlSendFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET })
    ).rejects.toThrow('actor not owned by session user')
  })

  it('does not call dalUpsertPendingRequest when ownership gate rejects', async () => {
    denyOwnership()
    await expect(
      ctrlSendFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET })
    ).rejects.toThrow()
    expect(dalUpsertPendingRequest).not.toHaveBeenCalled()
  })

  it('binds ownership on the requester actor before the block check', async () => {
    dalGetRequestStatus.mockResolvedValue(null)
    dalUpsertPendingRequest.mockResolvedValue(true)
    await ctrlSendFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET })
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: REQUESTER, userId: USER })
  })
})

describe('ctrlSendFollowRequest — idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    grantSession()
    ctrlGetBlockStatus.mockResolvedValue({ isBlocked: false })
  })

  it('returns "pending" without calling dalUpsertPendingRequest when already pending', async () => {
    dalGetRequestStatus.mockResolvedValue('pending')
    const result = await ctrlSendFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
    })
    expect(result).toBe('pending')
    expect(dalUpsertPendingRequest).not.toHaveBeenCalled()
  })

  it('returns "accepted" without calling dalUpsertPendingRequest when already accepted', async () => {
    dalGetRequestStatus.mockResolvedValue('accepted')
    const result = await ctrlSendFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
    })
    expect(result).toBe('accepted')
    expect(dalUpsertPendingRequest).not.toHaveBeenCalled()
  })

  it('upserts a new pending request when no existing request', async () => {
    dalGetRequestStatus.mockResolvedValue(null)
    dalUpsertPendingRequest.mockResolvedValue(true)
    const result = await ctrlSendFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
    })
    expect(result).toBe('pending')
    expect(dalUpsertPendingRequest).toHaveBeenCalledWith({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
    })
  })

  it('calls publishVcsmNotification to notify the target of a new request', async () => {
    dalGetRequestStatus.mockResolvedValue(null)
    dalUpsertPendingRequest.mockResolvedValue(true)
    await ctrlSendFollowRequest({
      requesterActorId: REQUESTER,
      targetActorId:    TARGET,
    })
    expect(publishVcsmNotification).toHaveBeenCalledTimes(1)
    const [notif] = publishVcsmNotification.mock.calls[0]
    expect(notif.recipientActorId).toBe(TARGET)
    expect(notif.kind).toBe('follow_request')
  })
})
