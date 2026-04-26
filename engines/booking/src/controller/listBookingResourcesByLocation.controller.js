import { dalListVportResourcesByLocationId } from '../dal/vportResource.read.dal.js'
import { mapVportResourceRows } from '../model/VportResource.model.js'

export async function listBookingResourcesByLocation({ locationId, includeInactive = false }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  const rows = await dalListVportResourcesByLocationId({ locationId, includeInactive })
  return mapVportResourceRows(rows)
}
