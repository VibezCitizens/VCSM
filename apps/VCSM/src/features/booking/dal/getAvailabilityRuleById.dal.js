import { vport as vportClient } from "@/services/supabase/vportClient";

const AVAILABILITY_RULE_SELECT = ["id", "resource_id"].join(",");

export async function getAvailabilityRuleByIdDAL({ ruleId } = {}) {
  if (!ruleId) {
    throw new Error("getAvailabilityRuleByIdDAL: ruleId is required");
  }

  const { data, error } = await vportClient
    .from("availability_rules")
    .select(AVAILABILITY_RULE_SELECT)
    .eq("id", ruleId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default getAvailabilityRuleByIdDAL;
