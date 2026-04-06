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

export async function getBookingByIdDAL({ bookingId } = {}) {
  if (!bookingId) {
    throw new Error("getBookingByIdDAL: bookingId is required");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default getBookingByIdDAL;
