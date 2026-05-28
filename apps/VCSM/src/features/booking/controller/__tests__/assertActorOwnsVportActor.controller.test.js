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
 * getActorByIdDAL IS called on the self-ownership path; only
 * readActorOwnerLinkByActorAndUserProfileDAL is skipped.
 *
 * Run: npx vitest run src/features/booking/controller/__tests__/assertActorOwnsVportActor.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/booking/dal/getActorById.dal', () => ({
  default: vi.fn(),
}))

vi.mock('@/features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal', () => ({
  default: vi.fn(),
}))

import { assertActorOwnsVportActorController } from '../assertActorOwnsVportActor.controller'
import getActorByIdDAL from '@/features/booking/dal/getActorById.dal'
import readActorOwnerLinkByActorAndUserProfileDAL from '@/features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal'

// ─── self ownership ───────────────────────────────────────────────────────────

describe('assertActorOwnsVportActorController — self ownership short-circuit (user-kind)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // ELEK-004: actor lookup runs before shortcut — must resolve a valid user-kind actor
    getActorByIdDAL.mockResolvedValue({
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

  it('calls getActorByIdDAL but NOT readActorOwnerLinkByActorAndUserProfileDAL on self-ownership path', async () => {
    // ELEK-004: kind check now always runs — getActorByIdDAL IS called even on self-match.
    // Only the DB ownership query (readActorOwnerLinkByActorAndUserProfileDAL) is skipped.
    await assertActorOwnsVportActorController({
      requestActorId: 'actor-abc',
      targetActorId:  'actor-abc',
    })
    expect(getActorByIdDAL).toHaveBeenCalledWith({ actorId: 'actor-abc' })
    expect(readActorOwnerLinkByActorAndUserProfileDAL).not.toHaveBeenCalled()
  })
})

// ─── ELEK-004: vport-kind actor must not bypass via self-match ────────────────

describe('assertActorOwnsVportActorController — ELEK-004: vport-kind self-match is rejected', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects a vport-kind actor even when requestActorId === targetActorId', async () => {
    getActorByIdDAL.mockResolvedValue({
      id: 'actor-vport-111', kind: 'vport', is_void: false, profile_id: 'prof-vport-1',
    })
    await expect(
      assertActorOwnsVportActorController({
        requestActorId: 'actor-vport-111',
        targetActorId:  'actor-vport-111',
      })
    ).rejects.toThrow('Only actor owners can manage this booking resource.')
    expect(readActorOwnerLinkByActorAndUserProfileDAL).not.toHaveBeenCalled()
  })
})

// ─── requester validation ─────────────────────────────────────────────────────

describe('assertActorOwnsVportActorController — requester validation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects void requester (is_void: true)', async () => {
    getActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: true, profile_id: 'prof-1',
    })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Requester actor not found.')
  })

  it('rejects non-user kind — vport actor cannot own another vport', async () => {
    getActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'vport', is_void: false, profile_id: 'prof-1',
    })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Only actor owners can manage this booking resource.')
  })

  it('rejects when requester has no profile_id', async () => {
    getActorByIdDAL.mockResolvedValue({
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
    getActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: false, profile_id: 'prof-1',
    })
  })

  it('rejects void ownerLink (ownership was deactivated)', async () => {
    readActorOwnerLinkByActorAndUserProfileDAL.mockResolvedValue({ id: 'link-1', is_void: true })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
  })

  it('rejects null ownerLink (no ownership record exists)', async () => {
    readActorOwnerLinkByActorAndUserProfileDAL.mockResolvedValue(null)
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
  })

  it('accepts valid active ownerLink and returns mode: "actor_owner"', async () => {
    const ownerLink = { id: 'link-1', is_void: false }
    readActorOwnerLinkByActorAndUserProfileDAL.mockResolvedValue(ownerLink)
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
    getActorByIdDAL.mockResolvedValueOnce({
      id: 'actor-2', kind: 'user', is_void: false, profile_id: 'prof-1',
    })
    readActorOwnerLinkByActorAndUserProfileDAL.mockResolvedValue({ id: 'link-1', is_void: false })
  })

  it('throws when target actor is void', async () => {
    getActorByIdDAL.mockResolvedValueOnce({ id: 'actor-99', kind: 'vport', is_void: true })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Target vport actor is not available.')
  })

  it('throws when target actor does not exist (null)', async () => {
    getActorByIdDAL.mockResolvedValueOnce(null)
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Target vport actor is not available.')
  })

  it('does not fetch target actor when ownerLink is void (throws before target check)', async () => {
    readActorOwnerLinkByActorAndUserProfileDAL.mockResolvedValue({ id: 'link-1', is_void: true })
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
    // getActorByIdDAL called once (requester only) — target check never reached
    expect(getActorByIdDAL).toHaveBeenCalledTimes(1)
  })

  it('does not fetch target actor when ownerLink is null (throws before target check)', async () => {
    readActorOwnerLinkByActorAndUserProfileDAL.mockResolvedValue(null)
    await expect(
      assertActorOwnsVportActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Actor does not own this vport actor.')
    expect(getActorByIdDAL).toHaveBeenCalledTimes(1)
  })
})
