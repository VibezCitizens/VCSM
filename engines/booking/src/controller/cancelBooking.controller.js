import { dalGetBookingById } from '../dal/booking.read.dal.js'
import { dalGetBookingResourceById } from '../dal/resource.read.dal.js'
import { dalUpdateBookingStatus } from '../dal/booking.write.dal.js'
import { assertActorOwnsVportActor } from './assertActorOwnsVportActor.controller.js'
import { mapBookingRow } from '../model/Booking.model.js'
import { getNotifyFn } from '../config.js'
import { BOOKING_EVENTS } from '../events.js'
import { dalGetActorById, dalGetVportProfileSlugByActorId } from '../dal/actor.read.dal.js'

export async function cancelBooking({ bookingId, requestActorId, cancelNote = undefined } = {}) {
  if (!bookingId)      throw new Error('[BookingEngine] bookingId is required')
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')

  const booking = await dalGetBookingById({ bookingId })
  if (!booking) throw new Error('Booking not found.')

  // BW-001 — Prevent mutation replay on finalized bookings.
  const TERMINAL_STATUSES = new Set(['cancelled', 'completed', 'no_show'])
  if (TERMINAL_STATUSES.has(booking.status)) {
    throw new Error('This booking has already been finalized and cannot be cancelled.')
  }

  // ELEK-001 — Validate requesting actor before isCustomer shortcut is evaluated.
  // A void or non-existent actor must not cancel via the customer-match path.
  const requestingActor = await dalGetActorById({ actorId: requestActorId })
  if (!requestingActor || requestingActor.is_void === true) {
    throw new Error('[BookingEngine] Only valid actors may cancel bookings.')
  }

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
    // Resolve canonical slug — raw actor UUIDs must never appear in public-facing notification links.
    // dalGetVportProfileSlugByActorId returns null on failure; linkPath is omitted when slug is unavailable.
    const ownerSlug = resource?.owner_actor_id
      ? await dalGetVportProfileSlugByActorId({ actorId: resource.owner_actor_id })
      : null
    getNotifyFn()?.({
      recipientActorId,
      actorId: requestActorId,
      kind: BOOKING_EVENTS.CANCELLED,
      objectType: 'booking',
      objectId: bookingId,
      linkPath: ownerSlug ? `/profile/${ownerSlug}?tab=book` : undefined,
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
