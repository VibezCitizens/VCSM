import { dalGetActorById } from '../dal/actor.read.dal.js'
import { dalGetOrganizationById, dalGetOrganizationMember } from '../dal/organization.read.dal.js'

const MANAGE_ROLES = ['owner', 'manager']

export async function assertActorCanManageOrganization({ requestActorId, organizationId }) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')

  const org = await dalGetOrganizationById({ organizationId })
  if (!org) throw new Error('Organization not found.')

  if (String(org.owner_actor_id) === String(requestActorId)) {
    return { ok: true, role: 'owner', mode: 'org_owner' }
  }

  const requester = await dalGetActorById({ actorId: requestActorId })
  if (!requester || requester.is_void === true) {
    throw new Error('Requester actor not found.')
  }

  const member = await dalGetOrganizationMember({ organizationId, actorId: requestActorId })
  if (!member || !MANAGE_ROLES.includes(member.role) || member.status !== 'active') {
    throw new Error('Actor does not have permission to manage this organization.')
  }

  return { ok: true, role: member.role, mode: 'org_member' }
}
