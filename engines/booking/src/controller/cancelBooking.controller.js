import { dalGetBookingById } from '../dal/booking.read.dal.js'
import { dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalUpdateBookingStatus } from '../dal/booking.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { mapBookingRow } from '../model/Booking.model.js'
import { getNotifyFn } from '../config.js'
import { BOOKING_EVENTS } from '../events.js'

export async function cancelBooking({ bookingId, requestActorId, cancelNote = undefined } = {}) {
  if (!bookingId)      throw new Error('[BookingEngine] bookingId is required')
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')

  const booking = await dalGetBookingById({ bookingId })
  if (!booking) throw new Error('Booking not found.')

  const isCustomer = booking.customer_actor_id &&
    String(booking.customer_actor_id) === String(requestActorId)

  const resource = await dalGetBookingResourceById({ resourceId: booking.resource_id })

  if (!isCustomer) {
    if (!resource) throw new Error('Booking resource not found.')
    await assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })
  }

  const updated = await dalUpdateBookingStatus({
    bookingId, status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    completedAt: null,
    internalNote: cancelNote,
  })
  if (!updated) throw new Error('Failed to cancel booking.')

  const mapped = mapBookingRow(updated)

  const recipientActorId = isCustomer ? resource?.owner_actor_id : booking.customer_actor_id
  if (recipientActorId && String(requestActorId) !== String(recipientActorId)) {
    getNotifyFn()?.({
      recipientActorId,
      actorId: requestActorId,
      kind: BOOKING_EVENTS.CANCELLED,
      objectType: 'booking',
      objectId: bookingId,
      linkPath: `/profile/${resource?.owner_actor_id ?? ''}?tab=book`,
      context: {
        serviceLabelSnapshot: booking.service_label_snapshot,
        startsAt: booking.starts_at,
        status: 'cancelled',
        cancelledBy: isCustomer ? 'customer' : 'owner',
      },
    })
  }

  return mapped
}
