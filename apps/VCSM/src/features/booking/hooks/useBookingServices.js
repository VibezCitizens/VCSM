import {
  readVportServicesByActor,
  listBookingServiceProfilesByServiceIds,
} from '@/features/booking/controllers/bookingServices.controller'

export function useBookingServices() {
  return {
    readVportServicesByActor,
    listBookingServiceProfilesByServiceIds,
  }
}
