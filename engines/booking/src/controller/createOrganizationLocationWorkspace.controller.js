import { dalGetActorById } from '../dal/actor.read.dal.js'
import { dalInsertOrganization, dalUpsertOrganizationProfile, dalUpsertOrganizationMember } from '../dal/organization.write.dal.js'
import { dalInsertLocation, dalUpsertLocationMember } from '../dal/location.write.dal.js'
import { dalInsertVportResource } from '../dal/vportResource.write.dal.js'

/**
 * Bootstrap a complete workspace: Organization → Profile link → Owner member →
 * Primary Location → Primary Resource → Location member.
 *
 * @param {{
 *   requestActorId: string,
 *   profileId: string,
 *   organizationName: string,
 *   organizationSlug: string,
 *   organizationType?: 'business'|'solo'|'brand',
 *   locationName: string,
 *   locationSlug: string,
 *   timezone?: string,
 *   resourceName: string,
 *   resourceType?: string,
 *   meta?: object|null,
 * }} params
 */
export async function createOrganizationLocationWorkspace({
  requestActorId,
  profileId,
  organizationName,
  organizationSlug,
  organizationType = 'business',
  locationName,
  locationSlug,
  timezone = 'UTC',
  resourceName,
  resourceType = 'staff',
  meta = null,
}) {
  if (!requestActorId)    throw new Error('[BookingEngine] requestActorId is required')
  if (!profileId)         throw new Error('[BookingEngine] profileId is required')
  if (!organizationName)  throw new Error('[BookingEngine] organizationName is required')
  if (!organizationSlug)  throw new Error('[BookingEngine] organizationSlug is required')
  if (!locationName)      throw new Error('[BookingEngine] locationName is required')
  if (!locationSlug)      throw new Error('[BookingEngine] locationSlug is required')
  if (!resourceName)      throw new Error('[BookingEngine] resourceName is required')

  const actor = await dalGetActorById({ actorId: requestActorId })
  if (!actor || actor.is_void === true) {
    throw new Error('Requester actor not found.')
  }

  const org = await dalInsertOrganization({
    ownerActorId:     requestActorId,
    name:             organizationName,
    slug:             organizationSlug,
    organizationType,
    meta,
  })

  await dalUpsertOrganizationProfile({
    organizationId: org.id,
    profileId,
    relationType: 'primary',
  })

  await dalUpsertOrganizationMember({
    organizationId: org.id,
    actorId:        requestActorId,
    role:           'owner',
    status:         'active',
  })

  const location = await dalInsertLocation({
    organizationId: org.id,
    profileId,
    name:      locationName,
    slug:      locationSlug,
    timezone,
    isPrimary: true,
  })

  const resource = await dalInsertVportResource({
    row: {
      owner_actor_id:  requestActorId,
      organization_id: org.id,
      location_id:     location.id,
      resource_type:   resourceType,
      name:            resourceName,
      is_active:       true,
      timezone,
      sort_order:      0,
    },
  })

  await dalUpsertLocationMember({
    locationId: location.id,
    actorId:    requestActorId,
    role:       'manager',
    resourceId: resource.id,
  })

  return {
    organization: org,
    location,
    resource,
  }
}
