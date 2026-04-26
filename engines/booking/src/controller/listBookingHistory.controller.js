import { dalListBookingsByResource } from '../dal/booking.read.dal.js'
import { mapBookingRows } from '../model/Booking.model.js'

export async function listBookingHistory({ resourceId, statuses = null, limit = 50, offset = 0 } = {}) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')

  const rows = await dalListBookingsByResource({ resourceId, statuses, limit, offset })
  return {
    bookings: mapBookingRows(rows),
    hasMore: rows.length >= limit,
  }
}
