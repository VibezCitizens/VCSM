import { listMyBookingsController } from '@/features/booking/controllers/listMyBookings.controller'
import { cancelBookingController } from '@/features/booking/controllers/cancelBooking.controller'

export function useBookingOps() {
  return {
    listMyBookings: listMyBookingsController,
    cancelBooking: cancelBookingController,
  }
}
