import { supabase } from "@/services/supabase/supabaseClient";

const BOOKING_AVAILABILITY_RULE_SELECT = [
  "id",
  "resource_id",
  "rule_type",
  "weekday",
  "start_time",
  "end_time",
  "valid_from",
  "valid_until",
  "is_active",
  "created_at",
  "updated_at",
].join(",");

export async function listAvailabilityRulesByResourceIdDAL({
  resourceId,
  includeInactive = false,
} = {}) {
  if (!resourceId) {
    throw new Error("listAvailabilityRulesByResourceIdDAL: resourceId is required");
  }

  let query = supabase
    .schema("vc")
    .from("booking_availability_rules")
    .select(BOOKING_AVAILABILITY_RULE_SELECT)
    .eq("resource_id", resourceId)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true })
    .order("created_at", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

export default listAvailabilityRulesByResourceIdDAL;
