import { dalListBookingResourcesByOwnerActorId } from '../dal/resource.read.dal.js'
import { mapBookingResourceRows } from '../model/BookingResource.model.js'

export async function listOwnerBookingResources({ ownerActorId, includeInactive = false } = {}) {
  if (!ownerActorId) throw new Error('[BookingEngine] ownerActorId is required')

  const rows = await dalListBookingResourcesByOwnerActorId({ ownerActorId, includeInactive })
  return mapBookingResourceRows(rows)
}
