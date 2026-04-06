import { supabase } from "@/services/supabase/supabaseClient";

const BOOKING_SELECT = [
  "id",
  "resource_id",
  "service_id",
  "customer_actor_id",
  "customer_profile_id",
  "status",
  "source",
  "starts_at",
  "ends_at",
  "timezone",
  "service_label_snapshot",
  "duration_minutes",
  "customer_name",
  "customer_phone",
  "customer_email",
  "customer_note",
  "internal_note",
  "cancelled_at",
  "completed_at",
  "created_by_actor_id",
  "created_at",
  "updated_at",
].join(",");

export async function updateBookingStatusDAL({
  bookingId,
  status,
  cancelledAt,
  completedAt,
  internalNote,
} = {}) {
  if (!bookingId) {
    throw new Error("updateBookingStatusDAL: bookingId is required");
  }
  if (!status) {
    throw new Error("updateBookingStatusDAL: status is required");
  }

  const patch = { status };
  if (cancelledAt !== undefined) patch.cancelled_at = cancelledAt;
  if (completedAt !== undefined) patch.completed_at = completedAt;
  if (internalNote !== undefined) patch.internal_note = internalNote;

  const { data, error } = await supabase
    .schema("vc")
    .from("bookings")
    .update(patch)
    .eq("id", bookingId)
    .select(BOOKING_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default updateBookingStatusDAL;
