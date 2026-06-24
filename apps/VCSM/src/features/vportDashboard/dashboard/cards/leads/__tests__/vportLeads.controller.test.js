/**
 * Regression tests — vportLeads.controller
 *
 * Security invariant (SPIDER-MAN / VENOM):
 * Every VPORT lead operation (list, count, markContacted, delete) must pass
 * the session-derived ownership gate (assertSessionOwnsActorController)
 * before any DAL is called. An unauthorized session must be rejected before any
 * data is read or written.
 *
 * TICKET-LEADS-OWNERSHIP-001: list/markContacted/delete were migrated off the
 * actor-owns gate (which rejected a VPORT-acting session at the user-kind kind
 * gate, ELEK-004) onto the session gate that count/fastCount already used.
 * Caller identity is derived from the auth session, never passed from the UI
 * (Identity Contract §1.3).
 *
 * Run: npx vitest run src/features/vportDashboard/dashboard/cards/leads/__tests__/vportLeads.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/authorization/adapters/authorization.adapter', () => ({
  // All four read/write paths gate through the session-derived ownership
  // controller (vportLeads.controller.js). It must be mocked and configured
  // per-group.
  assertSessionOwnsActorController: vi.fn(),
}))
vi.mock('@/features/vportDashboard/dal/read/vportProfile.read.dal', () => ({
  readVportProfileByActorIdDAL: vi.fn(),
}))
vi.mock('@/features/vportDashboard/dashboard/cards/leads/dal/vportLeads.read.dal', () => ({
  readVportBusinessCardLeadsByProfileDAL: vi.fn(),
  readNewLeadsCountByProfileDAL:          vi.fn(),
  readContactedLeadsCountByProfileDAL:    vi.fn(),
}))
vi.mock('@/features/vportDashboard/dashboard/cards/leads/dal/vportLeads.write.dal', () => ({
  deleteVportBusinessCardLeadDAL:         vi.fn(),
  markVportBusinessCardLeadContactedDAL:  vi.fn(),
}))
vi.mock('@/features/vportDashboard/dashboard/cards/leads/model/vportLead.model', () => ({
  normalizeVportLead: vi.fn((lead) => lead),
}))

import {
  listVportLeadsController,
  countNewVportLeadsController,
  countContactedVportLeadsController,
  fastCountNewVportLeadsController,
  markVportLeadContactedController,
  deleteVportLeadController,
} from '../controller/vportLeads.controller'
import { assertSessionOwnsActorController } from '@/features/authorization/adapters/authorization.adapter'
import { readVportProfileByActorIdDAL } from '@/features/vportDashboard/dal/read/vportProfile.read.dal'
import {
  readVportBusinessCardLeadsByProfileDAL,
  readNewLeadsCountByProfileDAL,
  readContactedLeadsCountByProfileDAL,
} from '@/features/vportDashboard/dashboard/cards/leads/dal/vportLeads.read.dal'
import {
  deleteVportBusinessCardLeadDAL,
  markVportBusinessCardLeadContactedDAL,
} from '@/features/vportDashboard/dashboard/cards/leads/dal/vportLeads.write.dal'

const VPORT_ID = 'actor-vport-111'

// ─── ownership gate: all entry points must block an unauthorized session ───────

describe('vportLeads.controller — ownership gate rejects unauthorized session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertSessionOwnsActorController.mockRejectedValue(
      new Error('Session user does not own this vport actor.')
    )
  })

  it('listVportLeadsController rejects and does not call any DAL', async () => {
    await expect(
      listVportLeadsController(VPORT_ID, {})
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(readVportBusinessCardLeadsByProfileDAL).not.toHaveBeenCalled()
  })

  it('countNewVportLeadsController rejects and does not call any DAL', async () => {
    await expect(
      countNewVportLeadsController(VPORT_ID)
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(readNewLeadsCountByProfileDAL).not.toHaveBeenCalled()
  })

  it('countContactedVportLeadsController rejects and does not call any DAL', async () => {
    await expect(
      countContactedVportLeadsController(VPORT_ID)
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(readContactedLeadsCountByProfileDAL).not.toHaveBeenCalled()
  })

  it('fastCountNewVportLeadsController rejects and does not call any DAL', async () => {
    await expect(
      fastCountNewVportLeadsController(VPORT_ID, 'profile-abc')
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(readNewLeadsCountByProfileDAL).not.toHaveBeenCalled()
  })

  it('markVportLeadContactedController rejects and does not call any DAL', async () => {
    await expect(
      markVportLeadContactedController(VPORT_ID, { leadId: 'lead-1' })
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(markVportBusinessCardLeadContactedDAL).not.toHaveBeenCalled()
  })

  it('deleteVportLeadController rejects and does not call any DAL', async () => {
    await expect(
      deleteVportLeadController(VPORT_ID, { leadId: 'lead-1' })
    ).rejects.toThrow()
    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled()
    expect(deleteVportBusinessCardLeadDAL).not.toHaveBeenCalled()
  })
})

// ─── legitimate owner: verify correct DAL is called with resolved profileId ───

describe('vportLeads.controller — legitimate owner routes to correct DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assertSessionOwnsActorController.mockResolvedValue({ ok: true })
    readVportProfileByActorIdDAL.mockResolvedValue({ id: 'profile-abc' })
  })

  it('listVportLeadsController gates the session, then reads via resolved profileId', async () => {
    readVportBusinessCardLeadsByProfileDAL.mockResolvedValue([
      { id: 'lead-1' },
      { id: 'lead-2' },
    ])
    // A VPORT-acting session that owns the target VPORT can list its leads.
    const result = await listVportLeadsController(VPORT_ID, { limit: 20 })
    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({
      targetActorId: VPORT_ID,
    })
    expect(readVportBusinessCardLeadsByProfileDAL).toHaveBeenCalledWith('profile-abc', { limit: 20, statusGroup: undefined })
    expect(result).toHaveLength(2)
  })

  it('listVportLeadsController forwards statusGroup to the read DAL (lazy active/contacted split)', async () => {
    readVportBusinessCardLeadsByProfileDAL.mockResolvedValue([{ id: 'lead-1' }])
    await listVportLeadsController(VPORT_ID, { limit: 150, statusGroup: 'contacted' })
    expect(readVportBusinessCardLeadsByProfileDAL).toHaveBeenCalledWith('profile-abc', {
      limit: 150,
      statusGroup: 'contacted',
    })
  })

  it('countContactedVportLeadsController gates the session then reads the contacted head count', async () => {
    readContactedLeadsCountByProfileDAL.mockResolvedValue(7)
    const result = await countContactedVportLeadsController(VPORT_ID)
    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({
      targetActorId: VPORT_ID,
    })
    expect(readContactedLeadsCountByProfileDAL).toHaveBeenCalledWith('profile-abc')
    expect(result).toBe(7)
  })

  it('countNewVportLeadsController calls readNewLeadsCountByProfileDAL with resolved profileId', async () => {
    readNewLeadsCountByProfileDAL.mockResolvedValue(5)
    const result = await countNewVportLeadsController(VPORT_ID)
    expect(readNewLeadsCountByProfileDAL).toHaveBeenCalledWith('profile-abc')
    expect(result).toEqual({ count: 5, resolvedProfileId: 'profile-abc' })
  })

  it('fastCountNewVportLeadsController gates ownership before reading cached profile count', async () => {
    readNewLeadsCountByProfileDAL.mockResolvedValue(3)
    // Signature is (actorId, profileId); ownership is gated via the session gate.
    const result = await fastCountNewVportLeadsController(VPORT_ID, 'profile-abc')
    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({
      targetActorId: VPORT_ID,
    })
    expect(readNewLeadsCountByProfileDAL).toHaveBeenCalledWith('profile-abc')
    expect(result).toBe(3)
  })

  it('fastCountNewVportLeadsController returns 0 for missing identity or profile scope', async () => {
    // Signature is (actorId, profileId); a falsy profileId short-circuits to 0.
    const result = await fastCountNewVportLeadsController(VPORT_ID, null)
    expect(readNewLeadsCountByProfileDAL).not.toHaveBeenCalled()
    expect(result).toBe(0)
  })

  it('deleteVportLeadController calls deleteVportBusinessCardLeadDAL and returns true', async () => {
    deleteVportBusinessCardLeadDAL.mockResolvedValue(undefined)
    const result = await deleteVportLeadController(VPORT_ID, { leadId: 'lead-42' })
    expect(deleteVportBusinessCardLeadDAL).toHaveBeenCalledWith({
      profileId: 'profile-abc',
      leadId:    'lead-42',
    })
    expect(result).toBe(true)
  })
})
