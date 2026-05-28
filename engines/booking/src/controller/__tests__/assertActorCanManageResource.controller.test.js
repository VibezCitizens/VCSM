/**
 * Regression tests — assertActorCanManageResource
 *
 * Security invariants (BW-001 / ELEK-2026-05-27-009):
 * - A void requestor must be rejected BEFORE any string-match ownership gate
 *   can return success (direct_owner, org_owner, resource_staff).
 * - A non-existent requestor must be rejected with the same guard.
 * - Valid, active direct owners must still pass.
 * - The vport_owner path must still delegate to assertActorOwnsVportActor.
 *
 * Run: npx vitest run src/controller/__tests__/assertActorCanManageResource.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../dal/actor.read.dal.js', () => ({
  dalGetActorById: vi.fn(),
}))
vi.mock('../../dal/resource.read.dal.js', () => ({
  dalGetBookingResourceById: vi.fn(),
}))
vi.mock('../../dal/vportResource.read.dal.js', () => ({
  dalGetVportResourceById: vi.fn(),
}))
vi.mock('../../dal/organization.read.dal.js', () => ({
  dalGetOrganizationById: vi.fn(),
  dalGetOrganizationMember: vi.fn(),
}))
vi.mock('../../dal/location.read.dal.js', () => ({
  dalGetLocationMember: vi.fn(),
}))
vi.mock('../assertActorOwnsVportActor.controller.js', () => ({
  assertActorOwnsVportActor: vi.fn(),
}))

import { assertActorCanManageResource } from '../assertActorCanManageResource.controller.js'
import { dalGetActorById }              from '../../dal/actor.read.dal.js'
import { dalGetVportResourceById }      from '../../dal/vportResource.read.dal.js'
import { dalGetBookingResourceById }    from '../../dal/resource.read.dal.js'
import { dalGetOrganizationById }       from '../../dal/organization.read.dal.js'
import { assertActorOwnsVportActor }    from '../assertActorOwnsVportActor.controller.js'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const ACTOR_ID      = 'actor-owner-111'
const RESOURCE_ID   = 'res-1'
const ORG_ID        = 'org-1'

const activeActor   = { id: ACTOR_ID, kind: 'user', is_void: false }
const voidActor     = { id: ACTOR_ID, kind: 'user', is_void: true  }

const directOwnerResource = {
  id:             RESOURCE_ID,
  owner_actor_id: ACTOR_ID,
  organization_id: null,
  location_id:    null,
  member_actor_id: null,
}

const orgOwnerResource = {
  id:             RESOURCE_ID,
  owner_actor_id: 'other-actor-999', // NOT the requester
  organization_id: ORG_ID,
  location_id:    null,
  member_actor_id: null,
}

const staffResource = {
  id:              RESOURCE_ID,
  owner_actor_id:  'other-actor-999', // NOT the requester
  organization_id: null,
  location_id:     null,
  member_actor_id: ACTOR_ID,          // requester is staff
}

// ─── BW-001 Void actor guard ──────────────────────────────────────────────────

describe('assertActorCanManageResource — void actor is rejected before any ownership check', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects void actor before direct_owner string-match can return success', async () => {
    dalGetActorById.mockResolvedValue(voidActor)
    dalGetVportResourceById.mockResolvedValue(directOwnerResource)

    await expect(
      assertActorCanManageResource({ requestActorId: ACTOR_ID, resourceId: RESOURCE_ID })
    ).rejects.toThrow('[BookingEngine] Only valid actors may manage booking resources.')

    // Ownership gates must never be reached — resource lookup should not have been the gate
    expect(assertActorOwnsVportActor).not.toHaveBeenCalled()
  })

  it('rejects void actor before org_owner string-match can return success', async () => {
    dalGetActorById.mockResolvedValue(voidActor)
    dalGetVportResourceById.mockResolvedValue(orgOwnerResource)
    // org_owner would have matched if we got that far
    dalGetOrganizationById.mockResolvedValue({ id: ORG_ID, owner_actor_id: ACTOR_ID })

    await expect(
      assertActorCanManageResource({ requestActorId: ACTOR_ID, resourceId: RESOURCE_ID })
    ).rejects.toThrow('[BookingEngine] Only valid actors may manage booking resources.')

    expect(dalGetOrganizationById).not.toHaveBeenCalled()
    expect(assertActorOwnsVportActor).not.toHaveBeenCalled()
  })

  it('rejects void actor before resource_staff string-match can return success', async () => {
    dalGetActorById.mockResolvedValue(voidActor)
    dalGetVportResourceById.mockResolvedValue(staffResource)

    await expect(
      assertActorCanManageResource({ requestActorId: ACTOR_ID, resourceId: RESOURCE_ID })
    ).rejects.toThrow('[BookingEngine] Only valid actors may manage booking resources.')

    expect(assertActorOwnsVportActor).not.toHaveBeenCalled()
  })

  it('rejects non-existent actor before any ownership check', async () => {
    dalGetActorById.mockResolvedValue(null)
    dalGetVportResourceById.mockResolvedValue(directOwnerResource)

    await expect(
      assertActorCanManageResource({ requestActorId: ACTOR_ID, resourceId: RESOURCE_ID })
    ).rejects.toThrow('[BookingEngine] Only valid actors may manage booking resources.')

    expect(assertActorOwnsVportActor).not.toHaveBeenCalled()
  })
})

// ─── Valid actor — ownership paths still pass ─────────────────────────────────

describe('assertActorCanManageResource — valid active actor ownership paths still function', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('allows valid direct owner (mode: direct_owner)', async () => {
    dalGetActorById.mockResolvedValue(activeActor)
    dalGetVportResourceById.mockResolvedValue(directOwnerResource)

    const result = await assertActorCanManageResource({
      requestActorId: ACTOR_ID,
      resourceId:     RESOURCE_ID,
    })

    expect(result).toMatchObject({ ok: true, role: 'owner', mode: 'direct_owner' })
    expect(assertActorOwnsVportActor).not.toHaveBeenCalled()
  })

  it('delegates to assertActorOwnsVportActor for vport_owner path when not direct_owner', async () => {
    // Resource owned by a different actor_id than the requester
    const nonDirectResource = {
      id:             RESOURCE_ID,
      owner_actor_id: 'vport-actor-777', // different from ACTOR_ID
      organization_id: null,
      location_id:    null,
      member_actor_id: null,
    }

    dalGetActorById.mockResolvedValue(activeActor)
    dalGetVportResourceById.mockResolvedValue(nonDirectResource)
    // assertActorOwnsVportActor resolves — requester is an owner of the vport actor
    assertActorOwnsVportActor.mockResolvedValue({ ok: true, mode: 'actor_owner' })

    const result = await assertActorCanManageResource({
      requestActorId: ACTOR_ID,
      resourceId:     RESOURCE_ID,
    })

    expect(result).toMatchObject({ ok: true, role: 'owner', mode: 'vport_owner' })
    expect(assertActorOwnsVportActor).toHaveBeenCalledWith({
      requestActorId: ACTOR_ID,
      targetActorId:  'vport-actor-777',
    })
  })

  it('rejects when all ownership paths fail', async () => {
    dalGetActorById.mockResolvedValue(activeActor)
    dalGetVportResourceById.mockResolvedValue({
      id:              RESOURCE_ID,
      owner_actor_id:  'other-actor-999',
      organization_id: null,
      location_id:     null,
      member_actor_id: null,
    })
    assertActorOwnsVportActor.mockRejectedValue(new Error('Actor does not own this vport actor.'))

    await expect(
      assertActorCanManageResource({ requestActorId: ACTOR_ID, resourceId: RESOURCE_ID })
    ).rejects.toThrow('Actor does not have permission to manage this resource.')
  })
})

// ─── Required param guards ────────────────────────────────────────────────────

describe('assertActorCanManageResource — required param guards', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when requestActorId is missing', async () => {
    await expect(
      assertActorCanManageResource({ resourceId: RESOURCE_ID })
    ).rejects.toThrow('[BookingEngine] requestActorId is required')
  })

  it('throws when resourceId is missing', async () => {
    await expect(
      assertActorCanManageResource({ requestActorId: ACTOR_ID })
    ).rejects.toThrow('[BookingEngine] resourceId is required')
  })
})
