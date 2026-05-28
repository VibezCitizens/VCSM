/**
 * Regression tests — vportLeads.controller
 *
 * Security invariant (SPIDER-MAN / VENOM):
 * Every VPORT lead operation (list, count, markContacted, delete) must pass
 * the assertActorOwnsVportActorController gate before any DAL is called.
 * An unauthorized caller must be rejected before any data is read or written.
 *
 * Run: npx vitest run src/features/dashboard/vport/controller/__tests__/vportLeads.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/booking/adapters/booking.adapter', () => ({
  assertActorOwnsVportActorController: vi.fn(),
}))
vi.mock('@/features/dashboard/vport/dal/read/vportProfile.read.dal', () => ({
  readVportProfileByActorIdDAL: vi.fn(),
}))
vi.mock('@/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal', () => ({
  readVportBusinessCardLeadsByProfileDAL: vi.fn(),
  readNewLeadsCountByProfileDAL:          vi.fn(),
}))
vi.mock('@/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal', () => ({
  deleteVportBusinessCardLeadDAL:         vi.fn(),
  markVportBusinessCardLeadContactedDAL:  vi.fn(),
}))
vi.mock('@/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model', () => ({
  normalizeVportLead: vi.fn((lead) => lead),
}))

import {
  listVportLeadsController,
  countNewVportLeadsController,
  fastCountNewVportLeadsController,
  markVportLeadContactedController,
  deleteVportLeadController,
} from '../controller/vportLeads.controller'
import { assertActorOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'
import { readVportProfileByActorIdDAL } from '@/features/dashboard/vport/dal/read/vportProfile.read.dal'
import {
  readVportBusinessCardLeadsByProfileDAL,
  readNewLeadsCountByProfileDAL,
} from '@/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal'
import {
  deleteVportBusinessCardLeadDAL,
  markVportBusinessCardLeadContactedDAL,
} from '@/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal'

const VPORT_ID   = 'actor-vport-111'
const OWNER_ID   = 'actor-owner-111'
const ATTACKER_ID = 'actor-attacker-999'

// ─── ownership gate: all entry points must block unauthorized callers ──────────

describe('vportLeads.controller — ownership gate rejects unauthorized caller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error('Actor does not own this vport actor.')
    )
  })

  it('listVportLeadsController rejects and does not call any DAL', async () => {
    await expect(
      listVportLeadsController(VPORT_ID, {}, ATTACKER_ID)
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(readVportBusinessCardLeadsByProfileDAL).not.toHaveBeenCalled()
  })

  it('countNewVportLeadsController rejects and does not call any DAL', async () => {
    await expect(
      countNewVportLeadsController(VPORT_ID, ATTACKER_ID)
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(readNewLeadsCountByProfileDAL).not.toHaveBeenCalled()
  })

  it('markVportLeadContactedController rejects and does not call any DAL', async () => {
    await expect(
      markVportLeadContactedController(VPORT_ID, { leadId: 'lead-1' }, ATTACKER_ID)
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(markVportBusinessCardLeadContactedDAL).not.toHaveBeenCalled()
  })

  it('deleteVportLeadController rejects and does not call any DAL', async () => {
    await expect(
      deleteVportLeadController(VPORT_ID, { leadId: 'lead-1' }, ATTACKER_ID)
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(deleteVportBusinessCardLeadDAL).not.toHaveBeenCalled()
  })
})

// ─── legitimate owner: verify correct DAL is called with resolved profileId ───

describe('vportLeads.controller — legitimate owner routes to correct DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertActorOwnsVportActorController.mockResolvedValue({ ok: true, mode: 'self' })
    readVportProfileByActorIdDAL.mockResolvedValue({ id: 'profile-abc' })
  })

  it('listVportLeadsController calls readVportBusinessCardLeadsByProfileDAL with resolved profileId', async () => {
    readVportBusinessCardLeadsByProfileDAL.mockResolvedValue([
      { id: 'lead-1' },
      { id: 'lead-2' },
    ])
    const result = await listVportLeadsController(VPORT_ID, { limit: 20 }, OWNER_ID)
    expect(readVportBusinessCardLeadsByProfileDAL).toHaveBeenCalledWith('profile-abc', { limit: 20 })
    expect(result).toHaveLength(2)
  })

  it('countNewVportLeadsController calls readNewLeadsCountByProfileDAL with resolved profileId', async () => {
    readNewLeadsCountByProfileDAL.mockResolvedValue(5)
    const result = await countNewVportLeadsController(VPORT_ID, OWNER_ID)
    expect(readNewLeadsCountByProfileDAL).toHaveBeenCalledWith('profile-abc')
    expect(result).toEqual({ count: 5, resolvedProfileId: 'profile-abc' })
  })

  it('fastCountNewVportLeadsController calls readNewLeadsCountByProfileDAL directly', async () => {
    readNewLeadsCountByProfileDAL.mockResolvedValue(3)
    const result = await fastCountNewVportLeadsController('profile-abc')
    expect(readNewLeadsCountByProfileDAL).toHaveBeenCalledWith('profile-abc')
    expect(result).toBe(3)
  })

  it('fastCountNewVportLeadsController returns 0 for missing profileId', async () => {
    const result = await fastCountNewVportLeadsController(null)
    expect(readNewLeadsCountByProfileDAL).not.toHaveBeenCalled()
    expect(result).toBe(0)
  })

  it('deleteVportLeadController calls deleteVportBusinessCardLeadDAL and returns true', async () => {
    deleteVportBusinessCardLeadDAL.mockResolvedValue(undefined)
    const result = await deleteVportLeadController(VPORT_ID, { leadId: 'lead-42' }, OWNER_ID)
    expect(deleteVportBusinessCardLeadDAL).toHaveBeenCalledWith({
      profileId: 'profile-abc',
      leadId:    'lead-42',
    })
    expect(result).toBe(true)
  })
})
