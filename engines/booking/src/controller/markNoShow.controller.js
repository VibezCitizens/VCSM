import { dalGetBookingById } from '../dal/booking.read.dal.js'
import { dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalUpdateBookingStatus } from '../dal/booking.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { mapBookingRow } from '../model/Booking.model.js'
import { getNotifyFn } from '../config.js'
import { BOOKING_EVENTS } from '../events.js'

export async function markNoShow({ bookingId, requestActorId, internalNote = undefined } = {}) {
  if (!bookingId)      throw new Error('[BookingEngine] bookingId is required')
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')

  const booking  = await dalGetBookingById({ bookingId })
  if (!booking) throw new Error('Booking not found.')

  if (booking.status === 'no_show')   throw new Error('Booking is already marked no-show.')
  if (booking.status === 'cancelled') throw new Error('Cannot mark a cancelled booking as no-show.')
  if (booking.status === 'completed') throw new Error('Cannot mark a completed booking as no-show.')

  const resource = await dalGetBookingResourceById({ resourceId: booking.resource_id })
  if (!resource)  throw new Error('Booking resource not found.')

  await assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })

  const updated = await dalUpdateBookingStatus({
    bookingId,
    status: 'no_show',
    completedAt: new Date().toISOString(),
    cancelledAt: null,
    internalNote,
  })
  if (!updated) throw new Error('Failed to mark booking as no-show.')

  const mapped = mapBookingRow(updated)

  if (booking.customer_actor_id && String(requestActorId) !== String(booking.customer_actor_id)) {
    getNotifyFn()?.({
      recipientActorId: booking.customer_actor_id,
      actorId: requestActorId,
      kind: BOOKING_EVENTS.NO_SHOW,
      objectType: 'booking',
      objectId: bookingId,
      linkPath: `/profile/${resource.owner_actor_id}?tab=book`,
      context: {
        serviceLabelSnapshot: booking.service_label_snapshot,
        startsAt: booking.starts_at,
        status: 'no_show',
      },
    })
  }

  return mapped
}
