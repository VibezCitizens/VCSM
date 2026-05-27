/**
 * Regression tests — createBooking
 *
 * Security / correctness invariants (SPIDER-MAN):
 * - Unknown booking sources must be rejected before any insert.
 * - durationMinutes must be > 0 and ≤ 1440.
 * - Bookings in the past must be rejected.
 * - Void requesters must be rejected for public bookings.
 * - Non-user actors (vport kind) must be rejected for public bookings.
 * - Management sources must enforce ownership before inserting.
 *
 * Run: npx vitest run src/controller/__tests__/createBooking.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../dal/resource.read.dal.js', () => ({
  dalGetBookingResourceById: vi.fn(),
}))
vi.mock('../../dal/vportResource.read.dal.js', () => ({
  dalGetVportResourceById:             vi.fn(),
  dalListVportResourcesByLocationId:   vi.fn(),
}))
vi.mock('../../dal/actor.read.dal.js', () => ({
  dalGetActorById: vi.fn(),
}))
vi.mock('../../dal/booking.write.dal.js', () => ({
  dalInsertBooking: vi.fn(),
}))
vi.mock('../../dal/vportBooking.write.dal.js', () => ({
  dalInsertVportBooking: vi.fn(),
}))
vi.mock('../assertActorOwnsVportActor.controller.js', () => ({
  assertActorOwnsVportActor: vi.fn(),
}))
vi.mock('../assertActorCanManageResource.controller.js', () => ({
  assertActorCanManageResource: vi.fn(),
}))
vi.mock('../../model/Booking.model.js', () => ({
  mapBookingRow: vi.fn((row) => ({ ...row, id: row?.id ?? 'mapped-booking-id' })),
}))
vi.mock('../../config.js', () => ({
  getNotifyFn: vi.fn(() => null),
}))
vi.mock('../../events.js', () => ({
  BOOKING_EVENTS: { CREATED: 'booking.created' },
}))

import { createBooking } from '../createBooking.controller.js'
import { dalGetVportResourceById }    from '../../dal/vportResource.read.dal.js'
import { dalGetActorById }            from '../../dal/actor.read.dal.js'
import { dalInsertVportBooking }      from '../../dal/vportBooking.write.dal.js'
import { assertActorCanManageResource } from '../assertActorCanManageResource.controller.js'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function futureIso(offsetMs = 3_600_000) {
  return new Date(Date.now() + offsetMs).toISOString()
}

const BASE_PARAMS = {
  resourceId:          'res-1',
  source:              'public',
  requestActorId:      'actor-citizen',
  startsAt:            futureIso(3_600_000),
  endsAt:              futureIso(7_200_000),
  timezone:            'America/New_York',
  serviceLabelSnapshot: 'Haircut',
  durationMinutes:     60,
}

const ACTIVE_VPORT_RESOURCE = {
  id:            'res-1',
  is_active:     true,
  profile_id:    'profile-abc',
  owner_actor_id: 'actor-owner-111',
}

// ─── input validation ────────────────────────────────────────────────────────

describe('createBooking — input validation (no resource lookup needed)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects past startsAt', async () => {
    await expect(
      createBooking({
        ...BASE_PARAMS,
        startsAt: '2020-01-01T00:00:00Z',
        endsAt:   '2020-01-01T01:00:00Z',
      })
    ).rejects.toThrow('This time slot is no longer available.')
  })

  it('rejects durationMinutes > 1440 (exceeds 24 hours)', async () => {
    await expect(
      createBooking({ ...BASE_PARAMS, durationMinutes: 1441 })
    ).rejects.toThrow(/duration/i)
  })

  it('rejects durationMinutes <= 0 (negative or zero not allowed)', async () => {
    await expect(
      createBooking({ ...BASE_PARAMS, durationMinutes: -30 })
    ).rejects.toThrow(/duration/i)
  })
})

// ─── source validation ────────────────────────────────────────────────────────

describe('createBooking — unknown source must be rejected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalGetVportResourceById.mockResolvedValue(ACTIVE_VPORT_RESOURCE)
    // Insert must never be called for an unknown source
    dalInsertVportBooking.mockResolvedValue({ id: 'booking-new' })
  })

  it('rejects unknown source before inserting', async () => {
    await expect(
      createBooking({ ...BASE_PARAMS, source: 'webhook' })
    ).rejects.toThrow()
    expect(dalInsertVportBooking).not.toHaveBeenCalled()
  })

  it('rejects source "api" (not in allowed set)', async () => {
    await expect(
      createBooking({ ...BASE_PARAMS, source: 'api' })
    ).rejects.toThrow()
    expect(dalInsertVportBooking).not.toHaveBeenCalled()
  })
})

// ─── citizen (public) booking validation ──────────────────────────────────────

describe('createBooking — public source citizen validation (VPORT flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalGetVportResourceById.mockResolvedValue(ACTIVE_VPORT_RESOURCE)
  })

  it('rejects void requester for public booking', async () => {
    dalGetActorById.mockResolvedValue({
      id: 'actor-void', kind: 'user', is_void: true,
    })
    await expect(
      createBooking({ ...BASE_PARAMS, source: 'public', requestActorId: 'actor-void' })
    ).rejects.toThrow('Only citizens can book appointments.')
  })

  it('rejects vport-kind actor for public booking (must switch to citizen profile)', async () => {
    dalGetActorById.mockResolvedValue({
      id: 'actor-vport-kind', kind: 'vport', is_void: false,
    })
    await expect(
      createBooking({ ...BASE_PARAMS, source: 'public', requestActorId: 'actor-vport-kind' })
    ).rejects.toThrow('Switch to your citizen profile to reserve.')
  })
})

// ─── management source ownership ─────────────────────────────────────────────

describe('createBooking — management source requires ownership (VPORT flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalGetVportResourceById.mockResolvedValue(ACTIVE_VPORT_RESOURCE)
  })

  it('rejects non-owner requesting management source', async () => {
    assertActorCanManageResource.mockRejectedValue(new Error('Not authorized.'))
    await expect(
      createBooking({ ...BASE_PARAMS, source: 'owner', requestActorId: 'actor-non-owner' })
    ).rejects.toThrow()
    expect(assertActorCanManageResource).toHaveBeenCalled()
    expect(dalInsertVportBooking).not.toHaveBeenCalled()
  })
})
