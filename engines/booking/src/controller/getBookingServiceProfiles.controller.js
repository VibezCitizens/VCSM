import { dalListBookingServiceProfilesByServiceIds } from '../dal/serviceProfile.read.dal.js'
import { mapBookingServiceProfileRows } from '../model/BookingServiceProfile.model.js'

export async function getBookingServiceProfiles({ serviceIds, includeNonBookable = false } = {}) {
  const ids = [...new Set((Array.isArray(serviceIds) ? serviceIds : []).map(String).filter(Boolean))]
  if (!ids.length) return []

  const rows = await dalListBookingServiceProfilesByServiceIds({ serviceIds: ids, includeNonBookable })
  return mapBookingServiceProfileRows(rows)
}
