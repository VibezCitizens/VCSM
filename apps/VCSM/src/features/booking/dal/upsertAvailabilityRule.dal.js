import { vport as vportClient } from "@/services/supabase/vportClient";

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

const RULE_WRITE_COLUMNS = Object.freeze([
  "id",
  "resource_id",
  "rule_type",
  "weekday",
  "start_time",
  "end_time",
  "valid_from",
  "valid_until",
  "is_active",
]);

function pickDefined(input, columns) {
  return columns.reduce((acc, key) => {
    if (input[key] !== undefined) acc[key] = input[key];
    return acc;
  }, {});
}

export async function upsertAvailabilityRuleDAL({ row } = {}) {
  if (!row || typeof row !== "object") {
    throw new Error("upsertAvailabilityRuleDAL: row is required");
  }
  if (!row.resource_id) {
    throw new Error("upsertAvailabilityRuleDAL: resource_id is required");
  }
  if (row.weekday == null) {
    throw new Error("upsertAvailabilityRuleDAL: weekday is required");
  }
  if (!row.start_time) {
    throw new Error("upsertAvailabilityRuleDAL: start_time is required");
  }
  if (!row.end_time) {
    throw new Error("upsertAvailabilityRuleDAL: end_time is required");
  }

  const payload = pickDefined(row, RULE_WRITE_COLUMNS);

  if (payload.id) {
    // Update existing rule — scope to both id AND resource_id to prevent
    // cross-resource hijack via a known foreign ruleId (ELEK-2026-06-04-001).
    const { data, error } = await vportClient
      .from("availability_rules")
      .update(payload)
      .eq("id", payload.id)
      .eq("resource_id", payload.resource_id)
      .select(BOOKING_AVAILABILITY_RULE_SELECT)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("upsertAvailabilityRuleDAL: rule not found or does not belong to this resource");
    return data;
  }

  const { data, error } = await vportClient
    .from("availability_rules")
    .insert(payload)
    .select(BOOKING_AVAILABILITY_RULE_SELECT)
    .single();

  if (error) throw error;
  return data ?? null;
}

export default upsertAvailabilityRuleDAL;
