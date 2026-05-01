import vportSchema from "@/services/supabase/vportClient";

const COLS = "id,resource_id,rule_type,weekday,start_time,end_time,valid_from,valid_until,is_active,created_at,updated_at";

export async function listVportAvailabilityRulesByResourceIdDAL({ resourceId } = {}) {
  if (!resourceId) return [];

  const { data, error } = await vportSchema
    .from("availability_rules")
    .select(COLS)
    .eq("resource_id", resourceId)
    .eq("is_active", true)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
