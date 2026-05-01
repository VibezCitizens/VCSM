import vportSchema from "@/services/supabase/vportClient";

const SELECT_COLS =
  "id,profile_id,key,label,description,service_group,sort_order,enabled,meta,created_at,updated_at";

export async function listVportServicesByProfileIdDAL({ profileId, includeDisabled = false } = {}) {
  if (!profileId) return [];

  let query = vportSchema
    .from("services")
    .select(SELECT_COLS)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("key", { ascending: true });

  if (!includeDisabled) query = query.eq("enabled", true);

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
