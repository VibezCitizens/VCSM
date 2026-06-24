/**
 * Regression tests — assertActorOwnsActorController
 *
 * Security invariant (VENOM V-002 / SPIDER-MAN / ELEK-004):
 * The ownership gate must verify actor_owners in the DB before granting access
 * to any VPORT-scoped operation.
 *
 * ELEK-004: The actor lookup and kind check run BEFORE the self-ownership
 * shortcut. A VPORT-kind actor with requestActorId === targetActorId must be
 * rejected — kind must be verified first, then the shortcut may apply.
 * readActorByIdDAL IS called on the self-ownership path; only
 * readOwnerLinkByProfileDAL is skipped.
 *
 * IDENTITY-BOUNDARY-005: this is now the canonical ownership authority. The
 * former booking compatibility wrapper has been removed; these regression tests
 * target the authorization controller directly.
 *
 * Run: npx vitest run src/features/authorization/controllers/__tests__/assertActorOwnsActor.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/authorization/dal/actors.read.dal', () => ({
  readActorByIdDAL: vi.fn(),
}))

vi.mock('@/features/authorization/dal/actorOwners.read.dal', () => ({
  readOwnerLinkByProfileDAL: vi.fn(),
  readOwnerLinkBySessionDAL: vi.fn(),
}))

import { assertActorOwnsActorController } from '../assertActorOwnsActor.controller'
import { readActorByIdDAL } from '@/features/authorization/dal/actors.read.dal'
import { readOwnerLinkByProfileDAL } from '@/features/authorization/dal/actorOwners.read.dal'

// ─── self ownership ───────────────────────────────────────────────────────────

describe('assertActorOwnsActorController — self ownership short-circuit (user-kind)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // ELEK-004: actor lookup runs before shortcut — must resolve a valid user-kind actor
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-abc', kind: 'user', is_void: false, profile_id: 'prof-1',
    })
  })

  it('resolves { ok: true, mode: "self" } when requestActorId === targetActorId and actor is user-kind', async () => {
    const result = await assertActorOwnsActorController({
      requestActorId: 'actor-abc',
      targetActorId:  'actor-abc',
    })
    expect(result).toEqual({ ok: true, mode: 'self' })
  })

  it('calls readActorByIdDAL but NOT readOwnerLinkByProfileDAL on self-ownership path', async () => {
    // ELEK-004: kind check now always runs — readActorByIdDAL IS called even on self-match.
    // Only the DB ownership query (readOwnerLinkByProfileDAL) is skipped.
    await assertActorOwnsActorController({
      requestActorId: 'actor-abc',
      targetActorId:  'actor-abc',
    })
    expect(readActorByIdDAL).toHaveBeenCalledWith({ actorId: 'actor-abc' })
    expect(readOwnerLinkByProfileDAL).not.toHaveBeenCalled()
  })
})

// ─── ELEK-004: vport-kind actor must not bypass via self-match ────────────────

describe('assertActorOwnsActorController — ELEK-004: vport-kind self-match is rejected', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects a vport-kind actor even when requestActorId === targetActorId', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-vport-111', kind: 'vport', is_void: false, profile_id: 'prof-vport-1',
    })
    await expect(
      assertActorOwnsActorController({
        requestActorId: 'actor-vport-111',
        targetActorId:  'actor-vport-111',
      })
    ).rejects.toThrow('Only actor owners can manage this booking resource.')
    expect(readOwnerLinkByProfileDAL).not.toHaveBeenCalled()
  })
})

// ─── requester validation ─────────────────────────────────────────────────────

describe('assertActorOwnsActorController — requester validation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects void requester (is_void: true)', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: true, profile_id: 'prof-1',
    })
    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Requester actor not found.')
  })

  it('rejects non-user kind — vport actor cannot own another vport', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'vport', is_void: false, profile_id: 'prof-1',
    })
    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Only actor owners can manage this booking resource.')
  })

  it('rejects when requester has no profile_id', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: false, profile_id: null,
    })
    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Requester actor is missing profile ownership identity.')
  })
})

// ─── actor_owners DB check ────────────────────────────────────────────────────

describe('assertActorOwnsActorController — actor_owners DB verification', () => {
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
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
  })

  it('rejects null ownerLink (no ownership record exists)', async () => {
    readOwnerLinkByProfileDAL.mockResolvedValue(null)
    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
  })

  it('accepts valid active ownerLink and returns mode: "actor_owner"', async () => {
    const ownerLink = { id: 'link-1', is_void: false }
    readOwnerLinkByProfileDAL.mockResolvedValue(ownerLink)
    const result = await assertActorOwnsActorController({
      requestActorId: 'actor-2',
      targetActorId:  'actor-99',
    })
    expect(result).toEqual({ ok: true, mode: 'actor_owner', ownerLink })
  })
})

// ─── target actor void check ──────────────────────────────────────────────────

describe('assertActorOwnsActorController — target actor void check', () => {
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
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Target vport actor is not available.')
  })

  it('throws when target actor does not exist (null)', async () => {
    readActorByIdDAL.mockResolvedValueOnce(null)
    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Target vport actor is not available.')
  })

  it('does not fetch target actor when ownerLink is void (throws before target check)', async () => {
    readOwnerLinkByProfileDAL.mockResolvedValue({ id: 'link-1', is_void: true })
    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
    // readActorByIdDAL called once (requester only) — target check never reached
    expect(readActorByIdDAL).toHaveBeenCalledTimes(1)
  })

  it('does not fetch target actor when ownerLink is null (throws before target check)', async () => {
    readOwnerLinkByProfileDAL.mockResolvedValue(null)
    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(readActorByIdDAL).toHaveBeenCalledTimes(1)
  })
})
