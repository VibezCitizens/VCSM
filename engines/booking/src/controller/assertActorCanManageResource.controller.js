import { dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalGetVportResourceById } from '../dal/vportResource.read.dal.js'
import { dalGetOrganizationById, dalGetOrganizationMember } from '../dal/organization.read.dal.js'
import { dalGetLocationMember } from '../dal/location.read.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { dalGetActorById } from '../dal/actor.read.dal.js'

const ORG_MANAGE_ROLES      = ['owner', 'manager']
const LOCATION_MANAGE_ROLES = ['manager']

export async function assertActorCanManageResource({ requestActorId, resourceId }) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')

  // BW-001 — Validate requesting actor is active before any ownership check.
  // Prevents void actors from passing direct string-match gates (direct_owner, org_owner,
  // resource_staff) that do not individually enforce is_void. Mirrors ELEK-001 pattern
  // from cancelBooking.
  const requestingActor = await dalGetActorById({ actorId: requestActorId })
  if (!requestingActor || requestingActor.is_void === true) {
    throw new Error('[BookingEngine] Only valid actors may manage booking resources.')
  }

  // Try vport.resources first (new org/location system), fall back to vc.booking_resources (legacy)
  const resource = await dalGetVportResourceById({ resourceId }).catch(() => null)
    ?? await dalGetBookingResourceById({ resourceId })
  if (!resource) throw new Error('Booking resource not found.')

  // Direct ownership (legacy barber flow)
  if (String(resource.owner_actor_id) === String(requestActorId)) {
    return { ok: true, role: 'owner', mode: 'direct_owner' }
  }

  // Vport actor ownership (owner managing their own vport resource)
  try {
    const ownerCheck = await assertActorOwnsVportActor({
      requestActorId,
      targetActorId: resource.owner_actor_id,
    })
    if (ownerCheck.ok) return { ok: true, role: 'owner', mode: 'vport_owner' }
  } catch (_) {
    // not a vport owner — continue to org/location checks
  }

  // Organization-level permission
  if (resource.organization_id) {
    const org = await dalGetOrganizationById({ organizationId: resource.organization_id })
    if (org && String(org.owner_actor_id) === String(requestActorId)) {
      return { ok: true, role: 'owner', mode: 'org_owner' }
    }
    const orgMember = await dalGetOrganizationMember({ organizationId: resource.organization_id, actorId: requestActorId })
    if (orgMember && ORG_MANAGE_ROLES.includes(orgMember.role) && orgMember.status === 'active') {
      return { ok: true, role: orgMember.role, mode: 'org_member' }
    }
  }

  // Location-level permission
  if (resource.location_id) {
    const locationMember = await dalGetLocationMember({ locationId: resource.location_id, actorId: requestActorId })
    if (locationMember && LOCATION_MANAGE_ROLES.includes(locationMember.role)) {
      return { ok: true, role: locationMember.role, mode: 'location_member' }
    }
  }

  // Staff member assigned to this resource
  if (resource.member_actor_id && String(resource.member_actor_id) === String(requestActorId)) {
    return { ok: true, role: 'staff', mode: 'resource_staff' }
  }

  throw new Error('Actor does not have permission to manage this resource.')
}
