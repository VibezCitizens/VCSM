/**
 * Regression tests — assertActorOwnsVportActorController
 *
 * Security invariant (VENOM V-002 / SPIDER-MAN):
 * The ownership gate must verify actor_owners in the DB before granting access
 * to any VPORT-scoped operation. The self-ownership short-circuit must resolve
 * without any DB call. Void and non-user requesters must be rejected immediately.
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

describe('assertActorOwnsVportActorController — self ownership short-circuit', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('resolves { ok: true, mode: "self" } when requestActorId === targetActorId', async () => {
    const result = await assertActorOwnsVportActorController({
      requestActorId: 'actor-abc',
      targetActorId:  'actor-abc',
    })
    expect(result).toEqual({ ok: true, mode: 'self' })
  })

  it('does not call any DAL when self-ownership short-circuits', async () => {
    await assertActorOwnsVportActorController({
      requestActorId: 'actor-abc',
      targetActorId:  'actor-abc',
    })
    expect(getActorByIdDAL).not.toHaveBeenCalled()
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
