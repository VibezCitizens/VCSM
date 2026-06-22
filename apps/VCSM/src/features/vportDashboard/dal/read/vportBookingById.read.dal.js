import vportSchema from "@/services/supabase/vportClient";

const SELECT_COLS =
  "id,profile_id,resource_id,service_id,customer_actor_id,status,source,starts_at,ends_at,timezone,service_label_snapshot,duration_minutes,customer_name,customer_note,created_by_actor_id,created_at";

export async function getVportBookingByIdDAL({ bookingId } = {}) {
  if (!bookingId) return null;

  const { data, error } = await vportSchema
    .from("bookings")
    .select(SELECT_COLS)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
