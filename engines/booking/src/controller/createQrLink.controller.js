import { dalInsertQrLink } from '../dal/qrLink.write.dal.js'
import { mapQrLinkRow } from '../model/QrLink.model.js'

export async function createQrLink({
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
  if (!qrType)          throw new Error('[BookingEngine] qrType is required')
  if (!slug)            throw new Error('[BookingEngine] slug is required')
  if (!destinationPath) throw new Error('[BookingEngine] destinationPath is required')

  const row = await dalInsertQrLink({
    organizationId, locationId, profileId, resourceId, serviceId,
    qrType, label, slug, destinationPath,
  })
  return mapQrLinkRow(row)
}
