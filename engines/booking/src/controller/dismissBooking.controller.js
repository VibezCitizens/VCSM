import { dalGetBookingById } from '../dal/booking.read.dal.js'
import { dalDeleteBooking } from '../dal/booking.write.dal.js'
import { dalGetVportBookingById } from '../dal/vportBooking.read.dal.js'
import { dalDeleteVportBooking } from '../dal/vportBooking.write.dal.js'

const DISMISSABLE = new Set(['cancelled', 'completed', 'no_show'])

export async function dismissBooking({ bookingId, requestActorId } = {}) {
  if (!bookingId)      throw new Error('[BookingEngine] bookingId is required')
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')

  // Try vc.bookings first, then vport.bookings
  const vcBooking = await dalGetBookingById({ bookingId }).catch(() => null)

  if (vcBooking) {
    if (String(vcBooking.customer_actor_id) !== String(requestActorId)) {
      throw new Error('Only the customer can remove this appointment.')
    }
    if (!DISMISSABLE.has(vcBooking.status)) {
      throw new Error('Only cancelled, completed, or no-show appointments can be removed.')
    }
    await dalDeleteBooking({ bookingId })
    return { ok: true }
  }

  const vportBooking = await dalGetVportBookingById({ bookingId }).catch(() => null)

  if (vportBooking) {
    if (String(vportBooking.customer_actor_id) !== String(requestActorId)) {
      throw new Error('Only the customer can remove this appointment.')
    }
    if (!DISMISSABLE.has(vportBooking.status)) {
      throw new Error('Only cancelled, completed, or no-show appointments can be removed.')
    }
    await dalDeleteVportBooking({ bookingId })
    return { ok: true }
  }

  throw new Error('Booking not found.')
}
