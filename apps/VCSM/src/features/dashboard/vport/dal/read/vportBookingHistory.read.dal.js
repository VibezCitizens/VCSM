import vportSchema from "@/services/supabase/vportClient";

const SELECT_COLS = "id,resource_id,service_id,customer_actor_id,status,source,starts_at,ends_at,timezone,service_label_snapshot,duration_minutes,customer_name,customer_note,created_by_actor_id,created_at,updated_at";

export async function listVportBookingHistoryDAL({ resourceId, limit = 50, offset = 0 } = {}) {
  if (!resourceId) return [];

  const { data, error } = await vportSchema
    .from("bookings")
    .select(SELECT_COLS)
    .eq("resource_id", resourceId)
    .order("starts_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
