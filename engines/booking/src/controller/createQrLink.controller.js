import { dalInsertQrLink } from '../dal/qrLink.write.dal.js'
import { mapQrLinkRow } from '../model/QrLink.model.js'
import { assertActorCanManageOrganization } from './assertActorCanManageOrganization.controller.js'
import { assertActorCanManageLocation } from './assertActorCanManageLocation.controller.js'
import { assertActorCanManageResource } from './assertActorCanManageResource.controller.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { dalGetActorByProfileId } from '../dal/actor.read.dal.js'

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
