import vportSchema from "@/services/supabase/vportClient";

const SELECT_COLS = "id,profile_id,resource_id,service_id,customer_actor_id,status,source,starts_at,ends_at,timezone,service_label_snapshot,duration_minutes,customer_name,customer_note,created_at,updated_at";

const UPDATABLE_COLS = [
  "status", "resource_id", "starts_at", "ends_at",
  "duration_minutes", "service_id", "service_label_snapshot",
  "customer_name", "customer_note",
  "cancelled_at", "completed_at",
];

function pick(obj, cols) {
  return cols.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});
}

export async function updateVportBookingDAL({ bookingId, profileId, updates } = {}) {
  if (!bookingId) throw new Error("updateVportBookingDAL: bookingId is required");
  if (!profileId) throw new Error("updateVportBookingDAL: profileId is required");
  const row = pick(updates ?? {}, UPDATABLE_COLS);
  if (!Object.keys(row).length) throw new Error("updateVportBookingDAL: no valid updates provided");

  const { data, error } = await vportSchema
    .from("bookings")
    .update(row)
    .eq("id", bookingId)
    .eq("profile_id", profileId)
    .select(SELECT_COLS)
    .single();

  if (error) throw error;
  return data ?? null;
}
