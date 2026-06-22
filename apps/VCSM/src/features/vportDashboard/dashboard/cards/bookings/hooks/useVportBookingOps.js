import {
  getVportResourceAvailabilityController,
  createVportPublicBookingController,
  listVportBookingResourcesController,
} from "@/features/vportDashboard/dashboard/cards/bookings/controller/vportPublicBooking.controller";

export function useVportBookingOps() {
  return {
    getAvailability: getVportResourceAvailabilityController,
    createBooking: createVportPublicBookingController,
    listResources: listVportBookingResourcesController,
  };
}
