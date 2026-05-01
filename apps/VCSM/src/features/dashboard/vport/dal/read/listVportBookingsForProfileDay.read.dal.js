import vportSchema from "@/services/supabase/vportClient";

const SELECT_COLS = "id,resource_id,service_id,customer_actor_id,status,source,starts_at,ends_at,timezone,service_label_snapshot,duration_minutes,customer_name,customer_note,created_at,updated_at";

export async function listVportBookingsForProfileDayDAL({ resourceIds, rangeStart, rangeEnd } = {}) {
  if (!Array.isArray(resourceIds) || resourceIds.length === 0 || !rangeStart || !rangeEnd) return [];

  const { data, error } = await vportSchema
    .from("bookings")
    .select(SELECT_COLS)
    .in("resource_id", resourceIds)
    .gte("starts_at", rangeStart)
    .lt("starts_at", rangeEnd)
    .not("status", "in", '("cancelled","no_show")')
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
