import { dalGetBookingById } from '../dal/booking.read.dal.js'
import { dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalUpdateBookingStatus } from '../dal/booking.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { mapBookingRow } from '../model/Booking.model.js'
import { getNotifyFn } from '../config.js'
import { BOOKING_EVENTS } from '../events.js'
import { dalGetVportProfileSlugByActorId } from '../dal/actor.read.dal.js'

export async function completeBooking({ bookingId, requestActorId, internalNote = undefined } = {}) {
  if (!bookingId)      throw new Error('[BookingEngine] bookingId is required')
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')

  const booking  = await dalGetBookingById({ bookingId })
  if (!booking) throw new Error('Booking not found.')

  if (booking.status === 'completed') throw new Error('Booking is already completed.')
  if (booking.status === 'cancelled') throw new Error('Cannot complete a cancelled booking.')
  if (booking.status === 'no_show')   throw new Error('Cannot complete a no-show booking.')

  const resource = await dalGetBookingResourceById({ resourceId: booking.resource_id })
  if (!resource)  throw new Error('Booking resource not found.')

  await assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })

  const updated = await dalUpdateBookingStatus({
    bookingId,
    status: 'completed',
    completedAt: new Date().toISOString(),
    cancelledAt: null,
    internalNote,
  })
  if (!updated) throw new Error('Failed to complete booking.')

  const mapped = mapBookingRow(updated)

  if (booking.customer_actor_id && String(requestActorId) !== String(booking.customer_actor_id)) {
    // Resolve canonical slug — raw owner_actor_id UUID must never appear in notification linkPath (VENOM V-006).
    const ownerSlug = resource?.owner_actor_id
      ? await dalGetVportProfileSlugByActorId({ actorId: resource.owner_actor_id })
      : null
    getNotifyFn()?.({
      recipientActorId: booking.customer_actor_id,
      actorId: requestActorId,
      kind: BOOKING_EVENTS.COMPLETED,
      objectType: 'booking',
      objectId: bookingId,
      linkPath: ownerSlug ? `/profile/${ownerSlug}?tab=book` : undefined,
      context: {
        serviceLabelSnapshot: booking.service_label_snapshot,
        startsAt: booking.starts_at,
        status: 'completed',
      },
    })
  }

  return mapped
}
