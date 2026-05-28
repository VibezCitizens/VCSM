import { dalInsertQrLink } from '../dal/qrLink.write.dal.js'
import { mapQrLinkRow } from '../model/QrLink.model.js'
import { assertActorCanManageOrganization } from './assertActorCanManageOrganization.controller.js'
import { assertActorCanManageLocation } from './assertActorCanManageLocation.controller.js'
import { assertActorCanManageResource } from './assertActorCanManageResource.controller.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { dalGetActorByProfileId } from '../dal/actor.read.dal.js'

// ELEK-006 — qrType allowlist. Only known QR link types may be persisted.
// Extending this list requires an explicit engineering decision — do not accept freeform input.
const QR_TYPE_ALLOWLIST = new Set(['menu', 'reviews', 'business_card'])

// ELEK-006 — destinationPath validator. Ensures the path is site-relative only.
// Rejects absolute URLs (any protocol), external hosts, and path traversal sequences.
function isRelativeDestinationPath(path) {
  if (typeof path !== 'string' || !path) return false
  if (!path.startsWith('/'))              return false  // must be path-relative
  if (path.includes('://'))              return false  // no absolute URLs
  if (path.includes('..'))               return false  // no path traversal
  return true
}

export async function createQrLink({
  requestActorId,
  organizationId = null,
  locationId = null,
  profileId = null,
  resourceId = null,
  serviceId = null,
  qrType,
  label = null,
  slug,
  destinationPath,
}) {
  if (!requestActorId)  throw new Error('[BookingEngine] requestActorId is required')
  if (!qrType)          throw new Error('[BookingEngine] qrType is required')
  if (!slug)            throw new Error('[BookingEngine] slug is required')
  if (!destinationPath) throw new Error('[BookingEngine] destinationPath is required')

  // ELEK-006 — Validate qrType against the allowlist.
  if (!QR_TYPE_ALLOWLIST.has(String(qrType))) {
    throw new Error(
      `[BookingEngine] Unknown qrType: "${qrType}". Allowed: ${[...QR_TYPE_ALLOWLIST].join(', ')}`
    )
  }

  // ELEK-006 — Validate destinationPath is site-relative only.
  if (!isRelativeDestinationPath(destinationPath)) {
    throw new Error(
      '[BookingEngine] destinationPath must be a relative path starting with "/" — external URLs are not permitted.'
    )
  }

  if (organizationId) {
    await assertActorCanManageOrganization({ requestActorId, organizationId })
  } else if (locationId) {
    await assertActorCanManageLocation({ requestActorId, locationId })
  } else if (resourceId) {
    await assertActorCanManageResource({ requestActorId, resourceId })
  } else if (profileId) {
    const profileActor = await dalGetActorByProfileId({ profileId })
    if (!profileActor) throw new Error('Profile actor not found.')
    if (String(profileActor.id) !== String(requestActorId)) {
      await assertActorOwnsVportActor({ requestActorId, targetActorId: profileActor.id })
    }
  } else {
    throw new Error('[BookingEngine] At least one of organizationId, locationId, resourceId, or profileId is required.')
  }

  const row = await dalInsertQrLink({
    organizationId, locationId, profileId, resourceId, serviceId,
    qrType, label, slug, destinationPath,
  })
  return mapQrLinkRow(row)
}
