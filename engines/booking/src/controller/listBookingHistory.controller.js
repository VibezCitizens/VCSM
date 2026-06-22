import { dalListBookingsByResource, dalListBookingsByResources } from '../dal/booking.read.dal.js'
import { mapBookingRows } from '../model/Booking.model.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'

// Owner booking history. Pass `resourceIds` to aggregate across all of a vport's
// resources (e.g. every barber's calendar); pass a single `resourceId` for one resource.
// RLS scopes returned rows to resources the caller owns regardless.
export async function listBookingHistory({ callerActorId, ownerActorId, resourceId, resourceIds = null, statuses = null, limit = 50, offset = 0 } = {}) {
  if (!callerActorId) throw new Error('[BookingEngine] callerActorId is required')
  if (!ownerActorId)  throw new Error('[BookingEngine] ownerActorId is required')

  const ids = Array.isArray(resourceIds) ? resourceIds.filter(Boolean) : []
  if (ids.length === 0 && !resourceId) throw new Error('[BookingEngine] resourceId or resourceIds is required')

  await assertActorOwnsVportActor({ requestActorId: callerActorId, targetActorId: ownerActorId })

  const rows = ids.length > 0
    ? await dalListBookingsByResources({ resourceIds: ids, statuses, limit, offset })
    : await dalListBookingsByResource({ resourceId, statuses, limit, offset })

  return {
    bookings: mapBookingRows(rows),
    hasMore: rows.length >= limit,
  }
}
