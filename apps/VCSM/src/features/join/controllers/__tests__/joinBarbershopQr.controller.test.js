/**
 * Regression tests — joinBarbershopQr.controller
 *
 * Security invariants:
 *
 * (pre-existing) acceptQrJoin must require callerActorId and assert ownership via
 * assertActorOwnsVportActorController before calling acceptJoinResourceDAL.
 *
 * ELEK-001: acceptQrJoin must verify resource state (meta.status === "pending_onboarding"
 * and member_actor_id === null) AFTER ownership assertion and BEFORE calling acceptJoinResourceDAL.
 * Used tokens and already-claimed slots must be rejected with a stable typed error before
 * any DAL write is attempted.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/booking/adapters/booking.adapter', () => ({
  assertActorOwnsVportActorController: vi.fn(),
}))

vi.mock('@/features/join/dal/joinInvite.dal', () => ({
  fetchJoinResourceByIdDAL: vi.fn(),
  acceptJoinResourceDAL: vi.fn(),
}))

vi.mock('@/features/join/dal/barberVport.read.dal', () => ({
  findBarberVportForUserDAL: vi.fn(),
}))

import { acceptQrJoin } from '../joinBarbershopQr.controller'
import { assertActorOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'
import { fetchJoinResourceByIdDAL, acceptJoinResourceDAL } from '@/features/join/dal/joinInvite.dal'

const TOKEN = 'token-abc'
const BARBER_VPORT_ACTOR_ID = 'actor-vport-111'
const CALLER_ACTOR_ID = 'actor-user-owner-222'

const PENDING_RESOURCE = {
  id: TOKEN,
  meta: { status: 'pending_onboarding' },
  member_actor_id: null,
}

// ─── null guard ───────────────────────────────────────────────────────────────

describe('acceptQrJoin — null guard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when callerActorId is null', async () => {
    await expect(
      acceptQrJoin(TOKEN, BARBER_VPORT_ACTOR_ID, null)
    ).rejects.toThrow('acceptQrJoin: callerActorId required')
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled()
    expect(acceptJoinResourceDAL).not.toHaveBeenCalled()
  })

  it('throws when callerActorId is undefined', async () => {
    await expect(
      acceptQrJoin(TOKEN, BARBER_VPORT_ACTOR_ID, undefined)
    ).rejects.toThrow('acceptQrJoin: callerActorId required')
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled()
    expect(acceptJoinResourceDAL).not.toHaveBeenCalled()
  })
})

// ─── ownership gate ───────────────────────────────────────────────────────────

describe('acceptQrJoin — ownership gate blocks unauthorized caller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error('Actor does not own this vport actor.')
    )
  })

  it('throws when ownership assertion fails and does not call acceptJoinResourceDAL', async () => {
    await expect(
      acceptQrJoin(TOKEN, BARBER_VPORT_ACTOR_ID, 'actor-attacker-999')
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(assertActorOwnsVportActorController).toHaveBeenCalledWith({
      requestActorId: 'actor-attacker-999',
      targetActorId: BARBER_VPORT_ACTOR_ID,
    })
    expect(acceptJoinResourceDAL).not.toHaveBeenCalled()
  })
})

// ─── ELEK-001: resource state guard ──────────────────────────────────────────

describe('acceptQrJoin — ELEK-001: resource state guard rejects used or claimed tokens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true })
  })

  it('throws "join resource not found" when fetchJoinResourceByIdDAL returns null', async () => {
    fetchJoinResourceByIdDAL.mockResolvedValue(null)
    await expect(
      acceptQrJoin(TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    ).rejects.toThrow('join resource not found')
    expect(acceptJoinResourceDAL).not.toHaveBeenCalled()
  })

  it('throws "join resource is no longer available" when meta.status !== pending_onboarding', async () => {
    fetchJoinResourceByIdDAL.mockResolvedValue({
      id: TOKEN,
      meta: { status: 'linked' },
      member_actor_id: BARBER_VPORT_ACTOR_ID,
    })
    await expect(
      acceptQrJoin(TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    ).rejects.toThrow('join resource is no longer available')
    expect(acceptJoinResourceDAL).not.toHaveBeenCalled()
  })

  it('throws "join resource is no longer available" when member_actor_id is already set', async () => {
    fetchJoinResourceByIdDAL.mockResolvedValue({
      id: TOKEN,
      meta: { status: 'pending_onboarding' },
      member_actor_id: 'actor-already-claimed',
    })
    await expect(
      acceptQrJoin(TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    ).rejects.toThrow('join resource is no longer available')
    expect(acceptJoinResourceDAL).not.toHaveBeenCalled()
  })

  it('throws "join resource is no longer available" when status is pending_acceptance (wrong type)', async () => {
    fetchJoinResourceByIdDAL.mockResolvedValue({
      id: TOKEN,
      meta: { status: 'pending_acceptance' },
      member_actor_id: null,
    })
    await expect(
      acceptQrJoin(TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    ).rejects.toThrow('join resource is no longer available')
    expect(acceptJoinResourceDAL).not.toHaveBeenCalled()
  })
})

// ─── ELEK-001: second accept returns clean error (replay simulation) ──────────

describe('acceptQrJoin — ELEK-001: concurrent/second accept returns stable error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true })
    // DAL-level guard: update matched no rows (token already used or race lost)
    acceptJoinResourceDAL.mockRejectedValue(new Error('join resource is no longer available'))
    fetchJoinResourceByIdDAL.mockResolvedValue(PENDING_RESOURCE)
  })

  it('propagates the DAL stable error when update matches no rows', async () => {
    await expect(
      acceptQrJoin(TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    ).rejects.toThrow('join resource is no longer available')
  })
})

// ─── legitimate owner passes all guards ──────────────────────────────────────

describe('acceptQrJoin — ownership gate passes for legitimate owner with valid resource state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true })
    fetchJoinResourceByIdDAL.mockResolvedValue(PENDING_RESOURCE)
    acceptJoinResourceDAL.mockResolvedValue({ id: TOKEN, member_actor_id: BARBER_VPORT_ACTOR_ID })
  })

  it('calls acceptJoinResourceDAL when ownership passes and resource is pending', async () => {
    const result = await acceptQrJoin(TOKEN, BARBER_VPORT_ACTOR_ID, CALLER_ACTOR_ID)
    expect(assertActorOwnsVportActorController).toHaveBeenCalledWith({
      requestActorId: CALLER_ACTOR_ID,
      targetActorId: BARBER_VPORT_ACTOR_ID,
    })
    expect(fetchJoinResourceByIdDAL).toHaveBeenCalledWith(TOKEN)
    expect(acceptJoinResourceDAL).toHaveBeenCalledWith(
      TOKEN,
      BARBER_VPORT_ACTOR_ID,
      expect.objectContaining({ join_token_used_at: expect.any(String) })
    )
    expect(result).toMatchObject({ id: TOKEN })
  })
})
