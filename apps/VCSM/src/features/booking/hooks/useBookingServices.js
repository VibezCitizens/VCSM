import {
  readVportServicesByActor,
  listBookingServiceProfilesByServiceIds,
} from '@/features/booking/controller/bookingServices.controller'

export function useBookingServices() {
  return {
    readVportServicesByActor,
    listBookingServiceProfilesByServiceIds,
  }
}
