import { dalGetBookingById } from '../dal/booking.read.dal.js'
import { dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalUpdateBookingStatus } from '../dal/booking.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { mapBookingRow } from '../model/Booking.model.js'
import { getNotifyFn } from '../config.js'
import { BOOKING_EVENTS } from '../events.js'

export async function confirmBooking({ bookingId, requestActorId, internalNote = undefined } = {}) {
  if (!bookingId)      throw new Error('[BookingEngine] bookingId is required')
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')

  const booking  = await dalGetBookingById({ bookingId })
  if (!booking) throw new Error('Booking not found.')

  const resource = await dalGetBookingResourceById({ resourceId: booking.resource_id })
  if (!resource)  throw new Error('Booking resource not found.')

  await assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })

  const updated = await dalUpdateBookingStatus({
    bookingId, status: 'confirmed', cancelledAt: null, completedAt: null, internalNote,
  })
  if (!updated) throw new Error('Failed to confirm booking.')

  const mapped = mapBookingRow(updated)

  if (booking.customer_actor_id && String(requestActorId) !== String(booking.customer_actor_id)) {
    getNotifyFn()?.({
      recipientActorId: booking.customer_actor_id,
      actorId: requestActorId,
      kind: BOOKING_EVENTS.CONFIRMED,
      objectType: 'booking',
      objectId: bookingId,
      linkPath: `/profile/${resource.owner_actor_id}?tab=book`,
      context: { serviceLabelSnapshot: booking.service_label_snapshot, startsAt: booking.starts_at, status: 'confirmed' },
    })
  }

  return mapped
}
