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

  const { data, error } = await supabase
    .schema("vc")
    .from("booking_availability_rules")
    .upsert(payload, { onConflict: "id" })
    .select(BOOKING_AVAILABILITY_RULE_SELECT)
    .single();

  if (error) throw error;
  return data ?? null;
}

export default upsertAvailabilityRuleDAL;
