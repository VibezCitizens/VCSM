/**
 * Regression tests — assertActorOwnsVportActorController
 *
 * Security invariant (VENOM V-002 / SPIDER-MAN / ELEK-004):
 * The ownership gate must verify actor_owners in the DB before granting access
 * to any VPORT-scoped operation.
 *
 * ELEK-004: The actor lookup and kind check now run BEFORE the self-ownership
 * shortcut. A VPORT-kind actor with requestActorId === targetActorId must be
 * rejected — kind must be verified first, then the shortcut may apply.
 * readActorByIdDAL IS called on the self-ownership path; only
 * readOwnerLinkByProfileDAL is skipped.
 *
 * Run: npx vitest run src/features/booking/controller/__tests__/assertActorOwnsVportActor.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// IDENTITY-BOUNDARY-004: the ownership authority moved to features/authorization.
// The booking controller is now a compatibility wrapper that delegates to the
// canonical authorization gate, so these regression tests mock the authorization
// DALs (the ones now actually executed) and drive the gate through the wrapper.
vi.mock('@/features/authorization/dal/actors.read.dal', () => ({
  readActorByIdDAL: vi.fn(),
}))

vi.mock('@/features/authorization/dal/actorOwners.read.dal', () => ({
  readOwnerLinkByProfileDAL: vi.fn(),
  readOwnerLinkBySessionDAL: vi.fn(),
}))

import { assertActorOwnsVportActorController } from '../assertActorOwnsVportActor.controller'
import { readActorByIdDAL } from '@/features/authorization/dal/actors.read.dal'
import { readOwnerLinkByProfileDAL } from '@/features/authorization/dal/actorOwners.read.dal'

// ─── self ownership ───────────────────────────────────────────────────────────

describe('assertActorOwnsVportActorController — self ownership short-circuit (user-kind)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // ELEK-004: actor lookup runs before shortcut — must resolve a valid user-kind actor
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-abc', kind: 'user', is_void: false, profile_id: 'prof-1',
    })
  })

  it('resolves { ok: true, mode: "self" } when requestActorId === targetActorId and actor is user-kind', async () => {
    const result = await assertActorOwnsVportActorController({
      requestActorId: 'actor-abc',
      targetActorId:  'actor-abc',
    })
    expect(result).toEqual({ ok: true, mode: 'self' })
  })

  it('calls readActorByIdDAL but NOT readOwnerLinkByProfileDAL on self-ownership path', async () => {
    // ELEK-004: kind check now always runs — readActorByIdDAL IS called even on self-match.
    // Only the DB ownership query (readOwnerLinkByProfileDAL) is skipped.
    await assertActorOwnsVportActorController({
      requestActorId: 'actor-abc',
      targetActorId:  'actor-abc',
    })
    expect(readActorByIdDAL).toHaveBeenCalledWith({ actorId: 'actor-abc' })
    expect(readOwnerLinkByProfileDAL).not.toHaveBeenCalled()
  })
})

// ─── ELEK-004: vport-kind actor must not bypass via self-match ────────────────

describe('assertActorOwnsVportActorController — ELEK-004: vport-kind self-match is rejected', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects a vport-kind actor even when requestActorId === targetActorId', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-vport-111', kind: 'vport', is_void: false, profile_id: 'prof-vport-1',
    })
    await expect(
      assertActorOwnsVportActorController({
        requestActorId: 'actor-vport-111',
        targetActorId:  'actor-vport-111',
      })
    ).rejects.toThrow('Only actor owners can manage this booking resource.')
    expect(readOwnerLinkByProfileDAL).not.toHaveBeenCalled()
  })
})

// ─── requester validation ─────────────────────────────────────────────────────

describe('assertActorOwnsVportActorController — requester validation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects void requester (is_void: true)', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: true, profile_id: 'prof-1',
    })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Requester actor not found.')
  })

  it('rejects non-user kind — vport actor cannot own another vport', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'vport', is_void: false, profile_id: 'prof-1',
    })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Only actor owners can manage this booking resource.')
  })

  it('rejects when requester has no profile_id', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: false, profile_id: null,
    })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Requester actor is missing profile ownership identity.')
  })
})

// ─── actor_owners DB check ────────────────────────────────────────────────────

describe('assertActorOwnsVportActorController — actor_owners DB verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // valid requester actor for all tests in this block
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: false, profile_id: 'prof-1',
    })
  })

  it('rejects void ownerLink (ownership was deactivated)', async () => {
    readOwnerLinkByProfileDAL.mockResolvedValue({ id: 'link-1', is_void: true })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
  })

  it('rejects null ownerLink (no ownership record exists)', async () => {
    readOwnerLinkByProfileDAL.mockResolvedValue(null)
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
  })

  it('accepts valid active ownerLink and returns mode: "actor_owner"', async () => {
    const ownerLink = { id: 'link-1', is_void: false }
    readOwnerLinkByProfileDAL.mockResolvedValue(ownerLink)
    const result = await assertActorOwnsVportActorController({
      requestActorId: 'actor-2',
      targetActorId:  'actor-99',
    })
    expect(result).toEqual({ ok: true, mode: 'actor_owner', ownerLink })
  })
})

// ─── target actor void check ──────────────────────────────────────────────────

describe('assertActorOwnsVportActorController — target actor void check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // First call: valid requester actor
    readActorByIdDAL.mockResolvedValueOnce({
      id: 'actor-2', kind: 'user', is_void: false, profile_id: 'prof-1',
    })
    readOwnerLinkByProfileDAL.mockResolvedValue({ id: 'link-1', is_void: false })
  })

  it('throws when target actor is void', async () => {
    readActorByIdDAL.mockResolvedValueOnce({ id: 'actor-99', kind: 'vport', is_void: true })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Target vport actor is not available.')
  })

  it('throws when target actor does not exist (null)', async () => {
    readActorByIdDAL.mockResolvedValueOnce(null)
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Target vport actor is not available.')
  })

  it('does not fetch target actor when ownerLink is void (throws before target check)', async () => {
    readOwnerLinkByProfileDAL.mockResolvedValue({ id: 'link-1', is_void: true })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
    // readActorByIdDAL called once (requester only) — target check never reached
    expect(readActorByIdDAL).toHaveBeenCalledTimes(1)
  })

  it('does not fetch target actor when ownerLink is null (throws before target check)', async () => {
    readOwnerLinkByProfileDAL.mockResolvedValue(null)
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(readActorByIdDAL).toHaveBeenCalledTimes(1)
  })
})
