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

vi.mock('@/features/auth/adapters/authSession.adapter', () => ({
  readCurrentAuthUser: vi.fn(),
}))

import { assertActorOwnsActorController } from '../assertActorOwnsActor.controller'
import { readActorByIdDAL } from '@/features/authorization/dal/actors.read.dal'
import { readOwnerLinkByProfileDAL } from '@/features/authorization/dal/actorOwners.read.dal'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'

// ─── self ownership ───────────────────────────────────────────────────────────

describe('assertActorOwnsActorController — self ownership short-circuit (user-kind)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // ELEK-004: actor lookup runs before shortcut — must resolve a valid user-kind actor
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-abc', kind: 'user', is_void: false, profile_id: 'prof-1',
    })
    // V02-H1: session bind passes when requester profile_id === session user id
    readCurrentAuthUser.mockResolvedValue({ id: 'prof-1' })
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

  it('rejects when requester profile_id does not match the session (null profile_id)', async () => {
    // V02-H1: a null profile_id cannot equal the session user id → session bind rejects.
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: false, profile_id: null,
    })
    readCurrentAuthUser.mockResolvedValue({ id: 'prof-1' })
    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Requester actor is not bound to the authenticated session.')
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
    // V02-H1: session bind passes (profile_id === session user id)
    readCurrentAuthUser.mockResolvedValue({ id: 'prof-1' })
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
    // V02-H1: session bind passes (profile_id === session user id)
    readCurrentAuthUser.mockResolvedValue({ id: 'prof-1' })
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

// ─── V02-H1: session binding ──────────────────────────────────────────────────

describe('assertActorOwnsActorController — V02-H1 session binding', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects the self-shortcut when requester profile_id !== session user id', async () => {
    // The zero-check self-shortcut must NOT grant: a forged self-match on a
    // user-kind actor the session does not own is now rejected (V02-H1 (a)).
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-victim', kind: 'user', is_void: false, profile_id: 'victim-uid',
    })
    readCurrentAuthUser.mockResolvedValue({ id: 'attacker-uid' })

    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-victim', targetActorId: 'actor-victim' })
    ).rejects.toThrow('Requester actor is not bound to the authenticated session.')
  })

  it('grants the self-shortcut only when requester profile_id === session user id', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-me', kind: 'user', is_void: false, profile_id: 'my-uid',
    })
    readCurrentAuthUser.mockResolvedValue({ id: 'my-uid' })

    const result = await assertActorOwnsActorController({
      requestActorId: 'actor-me', targetActorId: 'actor-me',
    })
    expect(result).toEqual({ ok: true, mode: 'self' })
  })

  it('rejects the owner path before the actor_owners query when not session-bound (V02-H1 (b))', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: false, profile_id: 'real-owner-uid',
    })
    readCurrentAuthUser.mockResolvedValue({ id: 'attacker-uid' })

    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('Requester actor is not bound to the authenticated session.')
    expect(readOwnerLinkByProfileDAL).not.toHaveBeenCalled()
  })

  it('rejects when there is no authenticated session', async () => {
    readActorByIdDAL.mockResolvedValue({
      id: 'actor-2', kind: 'user', is_void: false, profile_id: 'prof-1',
    })
    readCurrentAuthUser.mockResolvedValue(null)

    await expect(
      assertActorOwnsActorController({ requestActorId: 'actor-2', targetActorId: 'actor-99' })
    ).rejects.toThrow('No authenticated session.')
    expect(readOwnerLinkByProfileDAL).not.toHaveBeenCalled()
  })
})
