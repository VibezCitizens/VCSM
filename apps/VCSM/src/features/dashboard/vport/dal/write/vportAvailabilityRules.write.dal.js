import vportSchema from "@/services/supabase/vportClient";

const SELECT_COLS = "id,resource_id,rule_type,weekday,start_time,end_time,valid_from,valid_until,is_active,created_at,updated_at";

export async function upsertVportAvailabilityRuleDAL({ ruleId, resourceId, ruleType, weekday, startTime, endTime, isActive } = {}) {
  if (ruleId) {
    const { data, error } = await vportSchema
      .from("availability_rules")
      .update({
        rule_type:  ruleType,
        weekday:    weekday,
        start_time: startTime,
        end_time:   endTime,
        is_active:  isActive,
      })
      .eq("id", ruleId)
      .select(SELECT_COLS)
      .single();

    if (error) throw error;
    return data;
  }

  if (!resourceId) throw new Error("upsertVportAvailabilityRuleDAL: resourceId is required for insert");

  const { data, error } = await vportSchema
    .from("availability_rules")
    .insert({
      resource_id: resourceId,
      rule_type:   ruleType,
      weekday:     weekday,
      start_time:  startTime,
      end_time:    endTime,
      is_active:   isActive,
      valid_from:  null,
      valid_until: null,
    })
    .select(SELECT_COLS)
    .single();

  if (error) throw error;
  return data;
}
