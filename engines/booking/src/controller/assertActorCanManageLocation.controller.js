import { dalGetLocationById, dalGetLocationMember } from '../dal/location.read.dal.js'
import { dalGetOrganizationById, dalGetOrganizationMember } from '../dal/organization.read.dal.js'

const LOCATION_MANAGE_ROLES = ['manager']
const ORG_MANAGE_ROLES      = ['owner', 'manager']

export async function assertActorCanManageLocation({ requestActorId, locationId }) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!locationId) throw new Error('[BookingEngine] locationId is required')

  const location = await dalGetLocationById({ locationId })
  if (!location) throw new Error('Location not found.')

  const org = await dalGetOrganizationById({ organizationId: location.organization_id })
  if (!org) throw new Error('Parent organization not found.')

  if (String(org.owner_actor_id) === String(requestActorId)) {
    return { ok: true, role: 'owner', mode: 'org_owner' }
  }

  const orgMember = await dalGetOrganizationMember({ organizationId: location.organization_id, actorId: requestActorId })
  if (orgMember && ORG_MANAGE_ROLES.includes(orgMember.role) && orgMember.status === 'active') {
    return { ok: true, role: orgMember.role, mode: 'org_member' }
  }

  const locationMember = await dalGetLocationMember({ locationId, actorId: requestActorId })
  if (!locationMember || !LOCATION_MANAGE_ROLES.includes(locationMember.role)) {
    throw new Error('Actor does not have permission to manage this location.')
  }

  return { ok: true, role: locationMember.role, mode: 'location_member' }
}
