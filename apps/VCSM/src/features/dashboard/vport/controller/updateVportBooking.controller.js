import { updateVportBookingDAL } from "@/features/dashboard/vport/dal/write/updateVportBooking.write.dal";

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"];

export async function updateBookingStatusController({ bookingId, status }) {
  if (!bookingId)                    throw new Error("bookingId is required");
  if (!VALID_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);

  const updates = { status };
  if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
  if (status === "completed") updates.completed_at = new Date().toISOString();

  return updateVportBookingDAL({ bookingId, updates });
}

export async function rescheduleBookingController({ bookingId, startsAt, endsAt, resourceId, durationMinutes }) {
  if (!bookingId) throw new Error("bookingId is required");

  const updates = {};
  if (startsAt)        updates.starts_at        = startsAt;
  if (endsAt)          updates.ends_at          = endsAt;
  if (resourceId)      updates.resource_id      = resourceId;
  if (durationMinutes) updates.duration_minutes = Number(durationMinutes);

  return updateVportBookingDAL({ bookingId, updates });
}
