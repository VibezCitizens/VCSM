import { listMyBookingsController } from '@/features/booking/controller/listMyBookings.controller'
import { cancelBookingController } from '@/features/booking/controller/cancelBooking.controller'

export function useBookingOps() {
  return {
    listMyBookings: listMyBookingsController,
    cancelBooking: cancelBookingController,
  }
}
