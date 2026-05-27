/**
 * Regression tests — cancelBooking
 *
 * Security invariants (VENOM / SPIDER-MAN):
 * - Only the booking's customer OR the verified resource owner may cancel.
 * - A non-customer non-owner must be rejected BEFORE any write occurs.
 * - Customer cancellation must NOT trigger an assertActorOwnsVportActor DB call.
 * - Notification linkPath must use canonical slug routes — never raw actor UUIDs.
 *   Raw UUIDs in public-facing URLs are a VCSM platform invariant violation.
 *
 * Run: npx vitest run src/controller/__tests__/cancelBooking.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../dal/actor.read.dal.js', () => ({
  dalGetVportProfileSlugByActorId: vi.fn(),
}))
vi.mock('../../dal/booking.read.dal.js', () => ({
  dalGetBookingById: vi.fn(),
}))
vi.mock('../../dal/resource.read.dal.js', () => ({
  dalGetBookingResourceById: vi.fn(),
}))
vi.mock('../../dal/booking.write.dal.js', () => ({
  dalUpdateBookingStatus: vi.fn(),
}))
vi.mock('../assertActorOwnsVportActor.controller.js', () => ({
  assertActorOwnsVportActor: vi.fn(),
}))
vi.mock('../../model/Booking.model.js', () => ({
  mapBookingRow: vi.fn((row) => row),
}))
vi.mock('../../config.js', () => ({
  getNotifyFn: vi.fn(),
}))
vi.mock('../../events.js', () => ({
  BOOKING_EVENTS: { CANCELLED: 'booking.cancelled' },
}))

import { cancelBooking } from '../cancelBooking.controller.js'
import { dalGetBookingById }      from '../../dal/booking.read.dal.js'
import { dalGetBookingResourceById } from '../../dal/resource.read.dal.js'
import { dalUpdateBookingStatus } from '../../dal/booking.write.dal.js'
import { assertActorOwnsVportActor } from '../assertActorOwnsVportActor.controller.js'
import { getNotifyFn } from '../../config.js'
import { dalGetVportProfileSlugByActorId } from '../../dal/actor.read.dal.js'

// UUID pattern — any path segment matching this is a raw-ID violation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CUSTOMER_ID  = 'actor-customer-111'
const OWNER_UUID   = 'aabbccdd-0011-2233-4455-667788990011' // raw UUID in DB
const OWNER_SLUG   = 'my-barbershop-vport'                  // canonical slug — fix must use this
const ATTACKER_ID  = 'actor-attacker-999'

const fakeBooking = {
  id:                    'booking-abc',
  customer_actor_id:     CUSTOMER_ID,
  resource_id:           'res-1',
  service_label_snapshot: 'Haircut',
  starts_at:             '2026-07-01T10:00:00Z',
  status:                'confirmed',
}

// Resource as returned by the DAL — includes owner_actor_slug after the fix
const fakeResource = {
  id:               'res-1',
  owner_actor_id:   OWNER_UUID,
  owner_actor_slug: OWNER_SLUG,
}

const fakeUpdated = { ...fakeBooking, status: 'cancelled' }

// ─── authorization ─────────────────────────────────────────────────────────────

describe('cancelBooking — authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dalGetBookingById.mockResolvedValue(fakeBooking)
    dalGetBookingResourceById.mockResolvedValue(fakeResource)
    dalUpdateBookingStatus.mockResolvedValue(fakeUpdated)
    dalGetVportProfileSlugByActorId.mockResolvedValue(OWNER_SLUG)
    getNotifyFn.mockReturnValue(null) // no notification side-effects in auth tests
  })

  it('rejects non-customer non-owner before any write', async () => {
    assertActorOwnsVportActor.mockRejectedValue(new Error('Actor does not own this vport actor.'))
    await expect(
      cancelBooking({ bookingId: 'booking-abc', requestActorId: ATTACKER_ID })
    ).rejects.toThrow()
    expect(dalUpdateBookingStatus).not.toHaveBeenCalled()
  })

  it('allows customer cancellation without ownership DB check', async () => {
    const result = await cancelBooking({
      bookingId:       'booking-abc',
      requestActorId:  CUSTOMER_ID, // matches customer_actor_id
    })
    expect(assertActorOwnsVportActor).not.toHaveBeenCalled()
    expect(dalUpdateBookingStatus).toHaveBeenCalled()
    expect(result.status).toBe('cancelled')
  })

  it('allows owner cancellation after passing assertActorOwnsVportActor', async () => {
    assertActorOwnsVportActor.mockResolvedValue({ ok: true, mode: 'actor_owner' })

    // Use a fresh actorId that is NOT the customer
    const ownerActorId = 'actor-owner-different'
    const result = await cancelBooking({
      bookingId:      'booking-abc',
      requestActorId: ownerActorId,
    })
    expect(assertActorOwnsVportActor).toHaveBeenCalledWith({
      requestActorId: ownerActorId,
      targetActorId:  OWNER_UUID,
    })
    expect(dalUpdateBookingStatus).toHaveBeenCalled()
    expect(result.status).toBe('cancelled')
  })
})

// ─── notification linkPath safety ─────────────────────────────────────────────

describe('cancelBooking — notification linkPath must not expose raw UUIDs', () => {
  let capturedPayload

  beforeEach(() => {
    vi.clearAllMocks()
    dalGetBookingById.mockResolvedValue(fakeBooking)
    dalGetBookingResourceById.mockResolvedValue(fakeResource)
    dalUpdateBookingStatus.mockResolvedValue(fakeUpdated)
    assertActorOwnsVportActor.mockResolvedValue({ ok: true })
    dalGetVportProfileSlugByActorId.mockResolvedValue(OWNER_SLUG) // default: slug available
    capturedPayload = null
    getNotifyFn.mockReturnValue((payload) => { capturedPayload = payload })
  })

  it('notification linkPath uses canonical slug, never the raw owner_actor_id UUID', async () => {
    // Owner-side cancellation: requestActorId differs from customer → notification fires to customer
    await cancelBooking({ bookingId: 'booking-abc', requestActorId: 'actor-owner-different' })

    expect(capturedPayload, 'Notification must have fired').not.toBeNull()

    const { linkPath } = capturedPayload
    expect(linkPath, 'linkPath must be defined').toBeDefined()

    // Each path segment (before query string) must not be a raw UUID
    const segments = (linkPath ?? '').split('/').filter(Boolean)
    for (const seg of segments) {
      const cleanSeg = seg.split('?')[0]
      expect(
        UUID_RE.test(cleanSeg),
        `linkPath segment "${cleanSeg}" is a raw UUID — must use canonical slug instead`
      ).toBe(false)
    }

    // Positive assertion: must contain the canonical slug
    expect(linkPath).toContain(OWNER_SLUG)
  })

  it('omits or leaves empty linkPath when canonical slug is unavailable — never falls back to UUID', async () => {
    // Slug lookup returns null — controller must omit linkPath, not fall back to raw UUID
    dalGetVportProfileSlugByActorId.mockResolvedValue(null)

    await cancelBooking({ bookingId: 'booking-abc', requestActorId: 'actor-owner-different' })

    // If a linkPath was emitted it must contain no UUID
    if (capturedPayload?.linkPath) {
      const segments = (capturedPayload.linkPath ?? '').split('/').filter(Boolean)
      for (const seg of segments) {
        const cleanSeg = seg.split('?')[0]
        expect(
          UUID_RE.test(cleanSeg),
          `linkPath segment "${cleanSeg}" is a raw UUID — must be omitted when slug is unavailable`
        ).toBe(false)
      }
    }
    // linkPath absent / null / '' → correct defensive behavior, test passes
  })
})
