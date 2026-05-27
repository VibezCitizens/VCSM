import { dalListBookingsByResource } from '../dal/booking.read.dal.js'
import { mapBookingRows } from '../model/Booking.model.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'

export async function listBookingHistory({ callerActorId, ownerActorId, resourceId, statuses = null, limit = 50, offset = 0 } = {}) {
  if (!callerActorId) throw new Error('[BookingEngine] callerActorId is required')
  if (!ownerActorId)  throw new Error('[BookingEngine] ownerActorId is required')
  if (!resourceId)    throw new Error('[BookingEngine] resourceId is required')

  await assertActorOwnsVportActor({ requestActorId: callerActorId, targetActorId: ownerActorId })

  const rows = await dalListBookingsByResource({ resourceId, statuses, limit, offset })
  return {
    bookings: mapBookingRows(rows),
    hasMore: rows.length >= limit,
  }
}
