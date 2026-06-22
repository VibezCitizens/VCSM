import { createBookingController } from "../controller/createBooking.controller.js";

export function useBooking() {
  return createBookingController();
}
