import {
  createOwnerBookingController,
  updateBookingStatusController,
  rescheduleBookingController,
} from "@/features/vportDashboard/dashboard/cards/bookings";

export async function createScheduleBooking(params) {
  return createOwnerBookingController(params);
}

export async function updateScheduleBookingStatus(params) {
  return updateBookingStatusController(params);
}

export async function rescheduleScheduleBooking(params) {
  return rescheduleBookingController(params);
}
