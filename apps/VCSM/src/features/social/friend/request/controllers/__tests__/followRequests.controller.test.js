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

vi.mock('@/features/feed/adapters/feedCache.adapter', () => ({
  invalidateFeedFollowCache: vi.fn(),
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
import { invalidateFeedFollowCache } from '@/features/feed/adapters/feedCache.adapter'

// ─── fixtures ─────────────────────────────────────────────────────────────────

const REQUESTER = 'actor-requester-aaa-111'
const TARGET    = 'actor-target-bbb-222'
const ATTACKER  = 'actor-attacker-zzz-999'

// ─── ctrlAcceptFollowRequest — assertingActorId gate (existing, must not regress) ──

describe('ctrlAcceptFollowRequest — ownership gate (assertingActorId)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when assertingActorId is null', async () => {
    await expect(
      ctrlAcceptFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: null,
      })
    ).rejects.toThrow('session actor does not own this request')
  })

  it('throws when assertingActorId does not match targetActorId', async () => {
    await expect(
      ctrlAcceptFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow('session actor does not own this request')
  })

  it('does not call dalGetRequestStatus when ownership gate rejects', async () => {
    await expect(
      ctrlAcceptFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    expect(dalGetRequestStatus).not.toHaveBeenCalled()
  })

  it('does not call dalInsertFollow when ownership gate rejects', async () => {
    await expect(
      ctrlAcceptFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    expect(dalInsertFollow).not.toHaveBeenCalled()
  })

  it('proceeds when assertingActorId matches targetActorId', async () => {
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

describe('ctrlDeclineFollowRequest — ownership gate (assertingActorId)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when assertingActorId does not match targetActorId', async () => {
    await expect(
      ctrlDeclineFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow('session actor does not own this request')
  })

  it('does not call dalUpdateRequestStatus when ownership gate rejects', async () => {
    await expect(
      ctrlDeclineFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    expect(dalUpdateRequestStatus).not.toHaveBeenCalled()
  })

  it('proceeds and returns true when assertingActorId matches targetActorId', async () => {
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

describe('ctrlCancelFollowRequest — ownership gate (assertingActorId)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when assertingActorId does not match requesterActorId', async () => {
    await expect(
      ctrlCancelFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow('session actor does not own this request')
  })

  it('does not call dalUpdateRequestStatus when ownership gate rejects', async () => {
    await expect(
      ctrlCancelFollowRequest({
        requesterActorId: REQUESTER,
        targetActorId:    TARGET,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    expect(dalUpdateRequestStatus).not.toHaveBeenCalled()
  })

  it('proceeds when assertingActorId matches requesterActorId', async () => {
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

describe('ctrlListIncomingRequests — [V-SUB-003 REGRESSION] ownership gate: assertingActorId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalListIncomingPendingRequests.mockResolvedValue([])
  })

  it('throws when assertingActorId is null (unauthenticated)', async () => {
    await expect(
      ctrlListIncomingRequests({
        targetActorId:    TARGET,
        assertingActorId: null,
      })
    ).rejects.toThrow('session actor does not own this inbox')
  })

  it('throws when assertingActorId is undefined (missing from call site)', async () => {
    await expect(
      ctrlListIncomingRequests({
        targetActorId: TARGET,
        // assertingActorId intentionally omitted
      })
    ).rejects.toThrow('session actor does not own this inbox')
  })

  it('throws when assertingActorId does not match targetActorId (unauthorized inbox read)', async () => {
    await expect(
      ctrlListIncomingRequests({
        targetActorId:    TARGET,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow('session actor does not own this inbox')
  })

  it('does not call dalListIncomingPendingRequests when ownership gate rejects', async () => {
    await expect(
      ctrlListIncomingRequests({
        targetActorId:    TARGET,
        assertingActorId: ATTACKER,
      })
    ).rejects.toThrow()
    expect(dalListIncomingPendingRequests).not.toHaveBeenCalled()
  })

  it('proceeds when assertingActorId matches targetActorId (authentic owner)', async () => {
    dalListIncomingPendingRequests.mockResolvedValue([
      { requester_actor_id: REQUESTER, target_actor_id: TARGET, status: 'pending' },
    ])
    const result = await ctrlListIncomingRequests({
      targetActorId:    TARGET,
      assertingActorId: TARGET,
    })
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
  beforeEach(() => { vi.clearAllMocks() })

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

describe('ctrlSendFollowRequest — idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
