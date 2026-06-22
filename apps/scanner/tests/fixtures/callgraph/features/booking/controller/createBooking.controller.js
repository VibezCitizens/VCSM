import { insertBookingDAL } from "../dal/insertBooking.dal.js";

export function createBookingController() {
  return insertBookingDAL();
}
