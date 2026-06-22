import vportSchema from "@/services/supabase/vportClient";

const COLS = "id,resource_id,status,starts_at,ends_at,duration_minutes,service_label_snapshot,customer_name,customer_actor_id,created_at";

export async function listVportBookingsInRangeDAL({ resourceId, rangeStart, rangeEnd } = {}) {
  if (!resourceId || !rangeStart || !rangeEnd) return [];

  const { data, error } = await vportSchema
    .from("bookings")
    .select(COLS)
    .eq("resource_id", resourceId)
    .gte("starts_at", rangeStart)
    .lte("starts_at", rangeEnd)
    .not("status", "in", '("cancelled","no_show")');

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
