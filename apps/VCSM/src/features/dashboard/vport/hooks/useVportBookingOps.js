import {
  getVportResourceAvailabilityController,
  createVportPublicBookingController,
  listVportBookingResourcesController,
} from "@/features/dashboard/vport/controller/vportPublicBooking.controller";

export function useVportBookingOps() {
  return {
    getAvailability: getVportResourceAvailabilityController,
    createBooking: createVportPublicBookingController,
    listResources: listVportBookingResourcesController,
  };
}
