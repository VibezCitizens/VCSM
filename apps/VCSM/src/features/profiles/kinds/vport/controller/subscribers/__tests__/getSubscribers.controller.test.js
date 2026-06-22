/**
 * Regression tests — getSubscribersController
 *
 * Access model: PUBLIC READ with visibility enforcement (TICKET-SUB-011)
 *
 *   getSubscribersController is intentionally public. VPORT profiles are public
 *   business profiles; their subscriber (follower) list is social proof visible
 *   to any visitor, analogous to Instagram followers on a public business page.
 *
 *   No assertingActorId ownership gate is required or appropriate here.
 *   Contrast with ctrlListIncomingRequests (V-SUB-003) which reads INBOX data
 *   (private pending follow requests) and IS owner-gated.
 *
 *   The second caller (useVportBookingView) is gated owner-only at the hook level
 *   via `enabled: Boolean(isOwner && ownerActorId)` — the controller itself
 *   does not need to replicate that constraint.
 *
 *   Visibility is enforced via can_view_actor_signal RPC (TICKET-SUB-011).
 *   VPORT backfill defaults: follower_count_visibility = public,
 *   follower_list_visibility = public → anon callers see count and list by default.
 *
 * Run: npx vitest run src/features/profiles/kinds/vport/controller/subscribers/__tests__/getSubscribers.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/profiles/kinds/vport/dal/subscribersCount.dal', () => ({
  dalCountVportSubscribers: vi.fn(),
}))

vi.mock('@/features/profiles/kinds/vport/dal/subscribersList.dal', () => ({
  dalListVportSubscribers: vi.fn(),
}))

vi.mock('@/features/social/adapters/privacy/actorSignalVisibility.adapter', () => ({
  dalCanViewActorSignal: vi.fn(),
}))

import { getSubscribersController } from '../getSubscribers.controller'
import { dalCountVportSubscribers } from '@/features/profiles/kinds/vport/dal/subscribersCount.dal'
import { dalListVportSubscribers } from '@/features/profiles/kinds/vport/dal/subscribersList.dal'
import { dalCanViewActorSignal } from '@/features/social/adapters/privacy/actorSignalVisibility.adapter'

// ─── fixtures ─────────────────────────────────────────────────────────────────

const ACTOR_ID      = 'actor-vport-aaa-111'
const VIEWER_ID     = 'actor-follower-bbb-222'

const MOCK_SUBSCRIBER_ROW = {
  actor_id: 'actor-follower-bbb-222',
  kind: 'user',
  handle: 'citizenhandle',
  display_name: 'Citizen One',
}

// ─── guard: missing actorId ───────────────────────────────────────────────────

describe('getSubscribersController — guard: missing actorId', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns { count: 0, rows: [] } when actorId is null', async () => {
    const result = await getSubscribersController({ actorId: null })
    expect(result).toEqual({ count: 0, rows: [] })
  })

  it('returns { count: 0, rows: [] } when actorId is undefined', async () => {
    const result = await getSubscribersController({ actorId: undefined })
    expect(result).toEqual({ count: 0, rows: [] })
  })

  it('does not call dalCountVportSubscribers when actorId is missing', async () => {
    await getSubscribersController({ actorId: null })
    expect(dalCountVportSubscribers).not.toHaveBeenCalled()
  })

  it('does not call dalListVportSubscribers when actorId is missing', async () => {
    await getSubscribersController({ actorId: null })
    expect(dalListVportSubscribers).not.toHaveBeenCalled()
  })

  it('does not call dalCanViewActorSignal when actorId is missing', async () => {
    await getSubscribersController({ actorId: null })
    expect(dalCanViewActorSignal).not.toHaveBeenCalled()
  })
})

// ─── parallel DAL calls ───────────────────────────────────────────────────────

describe('getSubscribersController — parallel DAL calls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(5)
    dalListVportSubscribers.mockResolvedValue([MOCK_SUBSCRIBER_ROW])
    dalCanViewActorSignal.mockResolvedValue(true)
  })

  it('calls dalCountVportSubscribers with actorId', async () => {
    await getSubscribersController({ actorId: ACTOR_ID })
    expect(dalCountVportSubscribers).toHaveBeenCalledWith(ACTOR_ID)
  })

  it('calls dalListVportSubscribers with correct params', async () => {
    await getSubscribersController({ actorId: ACTOR_ID, limit: 25, offset: 50 })
    expect(dalListVportSubscribers).toHaveBeenCalledWith({
      actorId: ACTOR_ID,
      limit: 25,
      offset: 50,
    })
  })

  it('calls both DALs exactly once per invocation', async () => {
    await getSubscribersController({ actorId: ACTOR_ID })
    expect(dalCountVportSubscribers).toHaveBeenCalledTimes(1)
    expect(dalListVportSubscribers).toHaveBeenCalledTimes(1)
  })

  it('returns correct count and rows from both DALs', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.count).toBe(5)
    expect(result.rows).toEqual([MOCK_SUBSCRIBER_ROW])
  })
})

// ─── default pagination params ────────────────────────────────────────────────

describe('getSubscribersController — default pagination params', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(0)
    dalListVportSubscribers.mockResolvedValue([])
    dalCanViewActorSignal.mockResolvedValue(true)
  })

  it('uses limit: 50 by default', async () => {
    await getSubscribersController({ actorId: ACTOR_ID })
    expect(dalListVportSubscribers).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    )
  })

  it('uses offset: 0 by default', async () => {
    await getSubscribersController({ actorId: ACTOR_ID })
    expect(dalListVportSubscribers).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0 })
    )
  })
})

// ─── null/undefined DAL response handling ────────────────────────────────────

describe('getSubscribersController — null/undefined DAL response handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCanViewActorSignal.mockResolvedValue(true)
  })

  it('returns count: 0 when dalCountVportSubscribers resolves null', async () => {
    dalCountVportSubscribers.mockResolvedValue(null)
    dalListVportSubscribers.mockResolvedValue([])
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.count).toBe(0)
  })

  it('returns count: 0 when dalCountVportSubscribers resolves undefined', async () => {
    dalCountVportSubscribers.mockResolvedValue(undefined)
    dalListVportSubscribers.mockResolvedValue([])
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.count).toBe(0)
  })

  it('returns rows: [] when dalListVportSubscribers resolves null', async () => {
    dalCountVportSubscribers.mockResolvedValue(3)
    dalListVportSubscribers.mockResolvedValue(null)
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.rows).toEqual([])
  })

  it('returns rows: [] when dalListVportSubscribers resolves a non-array', async () => {
    dalCountVportSubscribers.mockResolvedValue(3)
    dalListVportSubscribers.mockResolvedValue('unexpected string')
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.rows).toEqual([])
  })
})

// ─── [PUBLIC READ] access model — intentional, no gate required ──────────────
// IRONMAN decision 2026-05-27: PUBLIC READ.
// Any caller may invoke this controller for any actorId. This matches the
// product intent: VportSubscribersView renders the subscriber list for every
// visitor to a VPORT profile page (no isOwner check at the view level).

describe('getSubscribersController — [PUBLIC READ] no assertingActorId required', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(10)
    dalListVportSubscribers.mockResolvedValue([MOCK_SUBSCRIBER_ROW])
    dalCanViewActorSignal.mockResolvedValue(true)
  })

  it('succeeds without assertingActorId — public read is intentional', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.count).toBe(10)
    expect(result.rows).toEqual([MOCK_SUBSCRIBER_ROW])
  })

  it('returns data for any actorId without an ownership check', async () => {
    const OTHER_ACTOR = 'actor-other-ccc-333'
    dalCountVportSubscribers.mockResolvedValue(3)
    dalListVportSubscribers.mockResolvedValue([])
    const result = await getSubscribersController({ actorId: OTHER_ACTOR })
    expect(result.count).toBe(3)
    expect(dalCountVportSubscribers).toHaveBeenCalledWith(OTHER_ACTOR)
  })
})

// ─── visibility: signal checks called with correct args ──────────────────────

describe('getSubscribersController — visibility signal dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(5)
    dalListVportSubscribers.mockResolvedValue([MOCK_SUBSCRIBER_ROW])
    dalCanViewActorSignal.mockResolvedValue(true)
  })

  it('calls dalCanViewActorSignal with follower_count signal', async () => {
    await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: VIEWER_ID })
    expect(dalCanViewActorSignal).toHaveBeenCalledWith({
      targetActorId: ACTOR_ID,
      viewerActorId: VIEWER_ID,
      signal: 'follower_count',
    })
  })

  it('calls dalCanViewActorSignal with follower_list signal', async () => {
    await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: VIEWER_ID })
    expect(dalCanViewActorSignal).toHaveBeenCalledWith({
      targetActorId: ACTOR_ID,
      viewerActorId: VIEWER_ID,
      signal: 'follower_list',
    })
  })

  it('calls dalCanViewActorSignal exactly twice per invocation', async () => {
    await getSubscribersController({ actorId: ACTOR_ID })
    expect(dalCanViewActorSignal).toHaveBeenCalledTimes(2)
  })

  it('passes null as viewerActorId when omitted', async () => {
    await getSubscribersController({ actorId: ACTOR_ID })
    expect(dalCanViewActorSignal).toHaveBeenCalledWith(
      expect.objectContaining({ viewerActorId: null })
    )
  })

  it('passes null as viewerActorId when explicitly null', async () => {
    await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: null })
    expect(dalCanViewActorSignal).toHaveBeenCalledWith(
      expect.objectContaining({ viewerActorId: null })
    )
  })

  it('passes viewerActorId when provided', async () => {
    await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: VIEWER_ID })
    expect(dalCanViewActorSignal).toHaveBeenCalledWith(
      expect.objectContaining({ viewerActorId: VIEWER_ID })
    )
  })
})

// ─── visibility: public VPORT → anon → count and list returned ───────────────

describe('getSubscribersController — visibility: public VPORT anon access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(42)
    dalListVportSubscribers.mockResolvedValue([MOCK_SUBSCRIBER_ROW])
    // VPORT backfill defaults: follower_count_visibility = public, follower_list_visibility = public
    dalCanViewActorSignal.mockResolvedValue(true)
  })

  it('anon viewer without viewerActorId receives count', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.count).toBe(42)
  })

  it('anon viewer without viewerActorId receives rows', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.rows).toEqual([MOCK_SUBSCRIBER_ROW])
  })

  it('no visibility field in response when both signals allowed', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result).not.toHaveProperty('visibility')
  })
})

// ─── visibility: follower_count denied ───────────────────────────────────────

describe('getSubscribersController — visibility: follower_count denied', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(42)
    dalListVportSubscribers.mockResolvedValue([MOCK_SUBSCRIBER_ROW])
    dalCanViewActorSignal.mockImplementation(({ signal }) =>
      Promise.resolve(signal !== 'follower_count')
    )
  })

  it('returns count: null when follower_count visibility denied', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.count).toBeNull()
  })

  it('still returns rows when only follower_count is denied', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.rows).toEqual([MOCK_SUBSCRIBER_ROW])
  })

  it('includes visibility: restricted when follower_count denied', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.visibility).toBe('restricted')
  })
})

// ─── visibility: follower_list denied ────────────────────────────────────────

describe('getSubscribersController — visibility: follower_list denied', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(42)
    dalListVportSubscribers.mockResolvedValue([MOCK_SUBSCRIBER_ROW])
    dalCanViewActorSignal.mockImplementation(({ signal }) =>
      Promise.resolve(signal !== 'follower_list')
    )
  })

  it('returns rows: [] when follower_list visibility denied', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.rows).toEqual([])
  })

  it('still returns count when only follower_list is denied', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.count).toBe(42)
  })

  it('includes visibility: restricted when follower_list denied', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.visibility).toBe('restricted')
  })
})

// ─── visibility: both denied ─────────────────────────────────────────────────

describe('getSubscribersController — visibility: both signals denied', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(42)
    dalListVportSubscribers.mockResolvedValue([MOCK_SUBSCRIBER_ROW])
    dalCanViewActorSignal.mockResolvedValue(false)
  })

  it('returns count: null when both signals denied', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.count).toBeNull()
  })

  it('returns rows: [] when both signals denied', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.rows).toEqual([])
  })

  it('includes visibility: restricted when both denied', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result.visibility).toBe('restricted')
  })

  it('restricted response shape is stable', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID })
    expect(result).toMatchObject({ count: null, rows: [], visibility: 'restricted' })
  })
})

// ─── visibility: owner viewer ─────────────────────────────────────────────────
// Owner tier is resolved DB-side by can_view_actor_signal.
// At the controller level, the bypass is transparent — controller passes
// viewerActorId to the RPC; the RPC returns true for owner tier.

describe('getSubscribersController — visibility: owner viewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(7)
    dalListVportSubscribers.mockResolvedValue([MOCK_SUBSCRIBER_ROW])
    // DB resolves owner tier → both signals visible
    dalCanViewActorSignal.mockResolvedValue(true)
  })

  it('owner viewerActorId is passed through to dalCanViewActorSignal', async () => {
    await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: ACTOR_ID })
    expect(dalCanViewActorSignal).toHaveBeenCalledWith(
      expect.objectContaining({ viewerActorId: ACTOR_ID, targetActorId: ACTOR_ID })
    )
  })

  it('owner receives count when DB grants visibility', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: ACTOR_ID })
    expect(result.count).toBe(7)
  })

  it('owner receives rows when DB grants visibility', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: ACTOR_ID })
    expect(result.rows).toEqual([MOCK_SUBSCRIBER_ROW])
  })

  it('no visibility field when owner DB grant returns true', async () => {
    const result = await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: ACTOR_ID })
    expect(result).not.toHaveProperty('visibility')
  })
})

// ─── visibility: follower tier ────────────────────────────────────────────────

describe('getSubscribersController — visibility: follower tier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalCountVportSubscribers.mockResolvedValue(10)
    dalListVportSubscribers.mockResolvedValue([MOCK_SUBSCRIBER_ROW])
  })

  it('follower receives count when follower_count_visibility = followers', async () => {
    // DB resolves follower tier → grants follower_count
    dalCanViewActorSignal.mockImplementation(({ signal }) =>
      Promise.resolve(signal === 'follower_count')
    )
    const result = await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: VIEWER_ID })
    expect(result.count).toBe(10)
  })

  it('follower gets restricted rows when follower_list_visibility = owner', async () => {
    // follower_list requires owner tier → denied
    dalCanViewActorSignal.mockImplementation(({ signal }) =>
      Promise.resolve(signal !== 'follower_list')
    )
    const result = await getSubscribersController({ actorId: ACTOR_ID, viewerActorId: VIEWER_ID })
    expect(result.rows).toEqual([])
    expect(result.visibility).toBe('restricted')
  })
})
