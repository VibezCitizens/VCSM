import { assertActorCanManageLocation } from './assertActorCanManageLocation.controller.js'
import { dalGetLocationById } from '../dal/location.read.dal.js'
import { dalInsertVportResource } from '../dal/vportResource.write.dal.js'
import { dalUpsertLocationMember } from '../dal/location.write.dal.js'

/**
 * Add a staff resource to an existing location.
 * Caller must be the org owner, org manager, or location manager.
 *
 * @param {{
 *   requestActorId: string,
 *   locationId: string,
 *   resourceName: string,
 *   resourceType?: string,
 *   memberActorId?: string|null,
 *   timezone?: string,
 *   sortOrder?: number,
 * }} params
 */
export async function createLocationResource({
  requestActorId,
  locationId,
  resourceName,
  resourceType = 'staff',
  memberActorId = null,
  timezone,
  sortOrder = 0,
}) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!locationId)     throw new Error('[BookingEngine] locationId is required')
  if (!resourceName)   throw new Error('[BookingEngine] resourceName is required')

  await assertActorCanManageLocation({ requestActorId, locationId })

  const location = await dalGetLocationById({ locationId })
  if (!location) throw new Error('Location not found.')

  const resource = await dalInsertVportResource({
    row: {
      owner_actor_id:  requestActorId,
      organization_id: location.organization_id,
      location_id:     locationId,
      profile_id:      location.profile_id ?? null,
      member_actor_id: memberActorId,
      resource_type:   resourceType,
      name:            resourceName,
      is_active:       true,
      timezone:        timezone ?? location.timezone ?? 'UTC',
      sort_order:      sortOrder,
    },
  })

  if (memberActorId) {
    await dalUpsertLocationMember({
      locationId,
      actorId:    memberActorId,
      role:       'staff',
      resourceId: resource.id,
    })
  }

  return resource
}
