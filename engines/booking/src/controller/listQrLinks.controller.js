import { dalListQrLinksByOrganization, dalListQrLinksByLocation, dalListQrLinksByProfile } from '../dal/qrLink.read.dal.js'
import { mapQrLinkRows } from '../model/QrLink.model.js'
import { assertActorCanManageOrganization } from './assertActorCanManageOrganization.controller.js'
import { assertActorCanManageLocation } from './assertActorCanManageLocation.controller.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { dalGetActorByProfileId } from '../dal/actor.read.dal.js'

/**
 * List QR links by organization.
 * requestActorId must be the organization owner or an active manager (owner/manager role).
 * Authorization mirrors createQrLink — asserts before any DAL read.
 */
export async function listQrLinksByOrganization({ requestActorId, organizationId }) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  await assertActorCanManageOrganization({ requestActorId, organizationId })
  const rows = await dalListQrLinksByOrganization({ organizationId })
  return mapQrLinkRows(rows)
}

/**
 * List QR links by location.
 * requestActorId must be able to manage the parent organization of this location.
 * Authorization mirrors createQrLink — asserts before any DAL read.
 */
export async function listQrLinksByLocation({ requestActorId, locationId }) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  await assertActorCanManageLocation({ requestActorId, locationId })
  const rows = await dalListQrLinksByLocation({ locationId })
  return mapQrLinkRows(rows)
}

/**
 * List QR links by profile.
 * requestActorId must own or manage the vport actor whose profile is being listed.
 * Authorization mirrors createQrLink — asserts before any DAL read.
 *
 * Note: resolveQrScan / dalGetQrLinkBySlug is the public slug-routing path
 * and does not use this function. Public QR routing is unaffected.
 */
export async function listQrLinksByProfile({ requestActorId, profileId }) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!profileId)      throw new Error('[BookingEngine] profileId is required')

  const profileActor = await dalGetActorByProfileId({ profileId })
  if (!profileActor) throw new Error('Profile actor not found.')

  // Self-check: VPORT actor managing its own profile QR links.
  if (String(profileActor.id) !== String(requestActorId)) {
    await assertActorOwnsVportActor({ requestActorId, targetActorId: profileActor.id })
  }

  const rows = await dalListQrLinksByProfile({ profileId })
  return mapQrLinkRows(rows)
}
