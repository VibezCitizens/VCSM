/**
 * Regression tests — vportTeamInvite.controller
 *
 * Security invariant (ELEK-002):
 * acceptTeamRequestController must use assertActorOwnsVportActorController
 * instead of String() equality to verify the caller owns the VPORT actor.
 *
 * Security invariant (ELEK-007):
 * getBarberTeamRequestsController must require callerActorId and assert
 * ownership before fetching any data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/booking/adapters/booking.adapter', () => ({
  assertActorOwnsVportActorController: vi.fn(),
}))

vi.mock('@/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.read.dal', () => ({
  fetchResourceByIdDAL: vi.fn(),
  fetchPendingTeamRequestsForBarberDAL: vi.fn(),
}))

vi.mock('@/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.write.dal', () => ({
  acceptTeamRequestDAL: vi.fn(),
  acceptTeamInviteByActorDAL: vi.fn(),
  declineTeamRequestDAL: vi.fn(),
}))

vi.mock('@/features/dashboard/vport/dal/read/vportProfile.read.dal', () => ({
  getVportActorIdByProfileIdDAL: vi.fn(),
}))

import {
  acceptTeamRequestController,
  acceptBarbershopInviteController,
  declineTeamRequestController,
  getBarberTeamRequestsController,
} from '../controller/vportTeamInvite.controller'
import { assertActorOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'
import {
  fetchResourceByIdDAL,
  fetchPendingTeamRequestsForBarberDAL,
} from '@/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.read.dal'
import {
  acceptTeamRequestDAL,
  acceptTeamInviteByActorDAL,
  declineTeamRequestDAL,
} from '@/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.write.dal'

const CALLER_ACTOR_ID = 'actor-barber-111'
const RESOURCE_ID = 'resource-abc'
const MEMBER_ACTOR_ID = 'actor-barber-111'
const VPORT_ACTOR_ID = 'actor-vport-shop-999'

// ELEK-001 / ELEK-002 constants
const INVITE_TOKEN = 'invite-token-xyz'
const BARBER_VPORT_ACTOR_ID = 'actor-vport-barber-444'  // vport-kind actor
const VIEWER_ACTOR_ID = 'user-session-owner-222'          // user-kind session actor

// ─── acceptTeamRequestController ─────────────────────────────────────────────

describe('acceptTeamRequestController — null guard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when callerActorId is null', async () => {
    await expect(
      acceptTeamRequestController(null, RESOURCE_ID)
    ).rejects.toThrow('acceptTeamRequestController: callerActorId required')
    expect(fetchResourceByIdDAL).not.toHaveBeenCalled()
  })
})

describe('acceptTeamRequestController — ownership gate blocks unauthorized caller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchResourceByIdDAL.mockResolvedValue({
      id: RESOURCE_ID,
      meta: { status: 'pending_acceptance' },
      member_actor_id: MEMBER_ACTOR_ID,
    })
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error('Actor does not own this vport actor.')
    )
  })

  it('throws when ownership assertion fails and does not call acceptTeamRequestDAL', async () => {
    await expect(
      acceptTeamRequestController('actor-attacker-999', RESOURCE_ID)
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(acceptTeamRequestDAL).not.toHaveBeenCalled()
  })
})

describe('acceptTeamRequestController — legitimate owner resolves', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchResourceByIdDAL.mockResolvedValue({
      id: RESOURCE_ID,
      meta: { status: 'pending_acceptance' },
      member_actor_id: MEMBER_ACTOR_ID,
    })
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true })
    acceptTeamRequestDAL.mockResolvedValue({ id: RESOURCE_ID, meta: { status: 'accepted' } })
  })

  it('calls acceptTeamRequestDAL when ownership passes', async () => {
    const result = await acceptTeamRequestController(CALLER_ACTOR_ID, RESOURCE_ID)
    expect(assertActorOwnsVportActorController).toHaveBeenCalledWith({
      requestActorId: CALLER_ACTOR_ID,
      targetActorId: MEMBER_ACTOR_ID,
    })
    expect(acceptTeamRequestDAL).toHaveBeenCalledWith(RESOURCE_ID, expect.any(Object))
    expect(result).toMatchObject({ id: RESOURCE_ID })
  })
})

// ─── getBarberTeamRequestsController ─────────────────────────────────────────

describe('getBarberTeamRequestsController — null guard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when callerActorId is null', async () => {
    const result = await getBarberTeamRequestsController(null, VPORT_ACTOR_ID)
    expect(result).toEqual([])
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled()
    expect(fetchPendingTeamRequestsForBarberDAL).not.toHaveBeenCalled()
  })

  it('returns empty array when barberVportActorId is null', async () => {
    const result = await getBarberTeamRequestsController(CALLER_ACTOR_ID, null)
    expect(result).toEqual([])
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled()
    expect(fetchPendingTeamRequestsForBarberDAL).not.toHaveBeenCalled()
  })
})

describe('getBarberTeamRequestsController — ownership gate blocks unauthorized caller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error('Actor does not own this vport actor.')
    )
  })

  it('throws when ownership assertion fails', async () => {
    await expect(
      getBarberTeamRequestsController('actor-attacker-999', VPORT_ACTOR_ID)
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(fetchPendingTeamRequestsForBarberDAL).not.toHaveBeenCalled()
  })
})

describe('getBarberTeamRequestsController — legitimate owner returns data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true })
    fetchPendingTeamRequestsForBarberDAL.mockResolvedValue([
      { id: 'req-1', member_actor_id: 'actor-barber-333' },
    ])
  })

  it('returns data when ownership passes', async () => {
    const result = await getBarberTeamRequestsController(CALLER_ACTOR_ID, VPORT_ACTOR_ID)
    expect(assertActorOwnsVportActorController).toHaveBeenCalledWith({
      requestActorId: CALLER_ACTOR_ID,
      targetActorId: VPORT_ACTOR_ID,
    })
    expect(fetchPendingTeamRequestsForBarberDAL).toHaveBeenCalledWith(VPORT_ACTOR_ID)
    expect(result).toHaveLength(1)
  })
})

// ─── ELEK-001: acceptBarbershopInviteController — resource state guard ────────

describe('acceptBarbershopInviteController — ELEK-001: resource state guard blocks stale/used invites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // ownership assertion should NOT be reached when state guard fires
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true })
  })

  it('throws "invite is no longer available" when status is not pending_acceptance', async () => {
    fetchResourceByIdDAL.mockResolvedValue({
      id: INVITE_TOKEN,
      meta: { status: 'linked' },
      member_actor_id: BARBER_VPORT_ACTOR_ID,
    })
    await expect(
      acceptBarbershopInviteController(INVITE_TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    ).rejects.toThrow('invite is no longer available')
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled()
    expect(acceptTeamInviteByActorDAL).not.toHaveBeenCalled()
  })

  it('throws "invite is no longer available" when status is declined', async () => {
    fetchResourceByIdDAL.mockResolvedValue({
      id: INVITE_TOKEN,
      meta: { status: 'declined' },
      member_actor_id: null,
    })
    await expect(
      acceptBarbershopInviteController(INVITE_TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    ).rejects.toThrow('invite is no longer available')
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled()
    expect(acceptTeamInviteByActorDAL).not.toHaveBeenCalled()
  })

  it('state guard fires BEFORE ownership assertion — wrong-status invite never reaches ownership check', async () => {
    // Simulate attacker with no ownership — ownership gate would reject, but state guard must fire first
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error('Actor does not own this vport actor.')
    )
    fetchResourceByIdDAL.mockResolvedValue({
      id: INVITE_TOKEN,
      meta: { status: 'pending_onboarding' }, // wrong type for acceptBarbershopInviteController
      member_actor_id: null,
    })
    await expect(
      acceptBarbershopInviteController(INVITE_TOKEN, BARBER_VPORT_ACTOR_ID, 'actor-attacker-999')
    ).rejects.toThrow('invite is no longer available')
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled()
  })
})

// ─── ELEK-001: acceptBarbershopInviteController — concurrent replay ───────────

describe('acceptBarbershopInviteController — ELEK-001: concurrent/second accept propagates stable DAL error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true })
    fetchResourceByIdDAL.mockResolvedValue({
      id: INVITE_TOKEN,
      meta: { status: 'pending_acceptance' },
      member_actor_id: BARBER_VPORT_ACTOR_ID,
    })
    // DAL-layer atomic guard: update matched no rows (race lost or token already used)
    acceptTeamInviteByActorDAL.mockRejectedValue(new Error('invite is no longer available'))
  })

  it('propagates stable DAL error when concurrent accept wins the race', async () => {
    await expect(
      acceptBarbershopInviteController(INVITE_TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    ).rejects.toThrow('invite is no longer available')
  })
})

// ─── acceptBarbershopInviteController — legitimate owner passes all guards ────

describe('acceptBarbershopInviteController — legitimate owner with valid invite state resolves', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchResourceByIdDAL.mockResolvedValue({
      id: INVITE_TOKEN,
      meta: { status: 'pending_acceptance' },
      member_actor_id: BARBER_VPORT_ACTOR_ID,
    })
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true })
    acceptTeamInviteByActorDAL.mockResolvedValue({ id: INVITE_TOKEN, meta: { status: 'accepted' } })
  })

  it('calls acceptTeamInviteByActorDAL when state is valid and ownership passes', async () => {
    const result = await acceptBarbershopInviteController(INVITE_TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    expect(fetchResourceByIdDAL).toHaveBeenCalledWith(INVITE_TOKEN)
    expect(assertActorOwnsVportActorController).toHaveBeenCalledWith({
      requestActorId: CALLER_ACTOR_ID,
      targetActorId: BARBER_VPORT_ACTOR_ID,
    })
    expect(acceptTeamInviteByActorDAL).toHaveBeenCalledWith(
      INVITE_TOKEN,
      BARBER_VPORT_ACTOR_ID,
      expect.objectContaining({ status: 'pending_acceptance' })
    )
    expect(result).toMatchObject({ id: INVITE_TOKEN })
  })
})

// ─── ELEK-002: declineTeamRequestController — invited barber path ─────────────

describe('declineTeamRequestController — ELEK-002: invited barber decline requires viewerActorId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // isInvitedBarber path: callerActorId === resource.member_actor_id
    fetchResourceByIdDAL.mockResolvedValue({
      id: RESOURCE_ID,
      meta: { status: 'pending_acceptance' },
      member_actor_id: BARBER_VPORT_ACTOR_ID,
    })
  })

  it('throws when viewerActorId is missing on isInvitedBarber path', async () => {
    await expect(
      declineTeamRequestController(BARBER_VPORT_ACTOR_ID, RESOURCE_ID, undefined)
    ).rejects.toThrow('declineTeamRequestController: viewerActorId required for invited barber path')
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled()
    expect(declineTeamRequestDAL).not.toHaveBeenCalled()
  })

  it('throws when viewerActorId is null on isInvitedBarber path', async () => {
    await expect(
      declineTeamRequestController(BARBER_VPORT_ACTOR_ID, RESOURCE_ID, null)
    ).rejects.toThrow('declineTeamRequestController: viewerActorId required for invited barber path')
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled()
  })
})

describe('declineTeamRequestController — ELEK-002: ownership gate blocks unauthorized session user on invited barber path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchResourceByIdDAL.mockResolvedValue({
      id: RESOURCE_ID,
      meta: { status: 'pending_acceptance' },
      member_actor_id: BARBER_VPORT_ACTOR_ID,
    })
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error('Actor does not own this vport actor.')
    )
  })

  it('throws when session user does not own the barber VPORT', async () => {
    await expect(
      declineTeamRequestController(BARBER_VPORT_ACTOR_ID, RESOURCE_ID, 'user-attacker-999')
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(assertActorOwnsVportActorController).toHaveBeenCalledWith({
      requestActorId: 'user-attacker-999',
      targetActorId: BARBER_VPORT_ACTOR_ID,
    })
    expect(declineTeamRequestDAL).not.toHaveBeenCalled()
  })

  it('notification-harvested IDs alone cannot bypass decline — ownership still required', async () => {
    // Attacker harvested BARBER_VPORT_ACTOR_ID and RESOURCE_ID from a notification payload.
    // String match fires (callerActorId === member_actor_id) but ownership assertion blocks.
    await expect(
      declineTeamRequestController(BARBER_VPORT_ACTOR_ID, RESOURCE_ID, 'user-notification-harvester-666')
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(declineTeamRequestDAL).not.toHaveBeenCalled()
  })
})

describe('declineTeamRequestController — ELEK-002: invited barber decline succeeds for verified owner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchResourceByIdDAL.mockResolvedValue({
      id: RESOURCE_ID,
      meta: { status: 'pending_acceptance' },
      member_actor_id: BARBER_VPORT_ACTOR_ID,
    })
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true })
    declineTeamRequestDAL.mockResolvedValue({ id: RESOURCE_ID, meta: { status: 'declined' } })
  })

  it('calls declineTeamRequestDAL when session user owns the barber VPORT', async () => {
    const result = await declineTeamRequestController(BARBER_VPORT_ACTOR_ID, RESOURCE_ID, VIEWER_ACTOR_ID)
    expect(assertActorOwnsVportActorController).toHaveBeenCalledWith({
      requestActorId: VIEWER_ACTOR_ID,
      targetActorId: BARBER_VPORT_ACTOR_ID,
    })
    expect(declineTeamRequestDAL).toHaveBeenCalledWith(RESOURCE_ID, expect.any(Object))
    expect(result).toMatchObject({ id: RESOURCE_ID })
  })
})
