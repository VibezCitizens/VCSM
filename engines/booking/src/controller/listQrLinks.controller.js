import { dalListQrLinksByOrganization, dalListQrLinksByLocation, dalListQrLinksByProfile } from '../dal/qrLink.read.dal.js'
import { mapQrLinkRows } from '../model/QrLink.model.js'

export async function listQrLinksByOrganization({ organizationId }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  const rows = await dalListQrLinksByOrganization({ organizationId })
  return mapQrLinkRows(rows)
}

export async function listQrLinksByLocation({ locationId }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  const rows = await dalListQrLinksByLocation({ locationId })
  return mapQrLinkRows(rows)
}

export async function listQrLinksByProfile({ profileId }) {
  if (!profileId) throw new Error('[BookingEngine] profileId is required')
  const rows = await dalListQrLinksByProfile({ profileId })
  return mapQrLinkRows(rows)
}
