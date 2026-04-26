import { dalListBookingResourcesByLocationId } from '../dal/resource.read.dal.js'
import { mapBookingResourceRows } from '../model/BookingResource.model.js'

export async function listBookingResourcesByLocation({ locationId, includeInactive = false }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  const rows = await dalListBookingResourcesByLocationId({ locationId, includeInactive })
  return mapBookingResourceRows(rows)
}
