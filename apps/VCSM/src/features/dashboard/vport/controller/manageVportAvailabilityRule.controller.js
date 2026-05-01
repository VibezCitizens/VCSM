import { upsertVportAvailabilityRuleDAL } from "@/features/dashboard/vport/dal/write/vportAvailabilityRules.write.dal";

export async function manageVportAvailabilityRuleController({
  ruleId,
  resourceId,
  ruleType,
  weekday,
  startTime,
  endTime,
  isActive,
}) {
  try {
    await upsertVportAvailabilityRuleDAL({ ruleId, resourceId, ruleType, weekday, startTime, endTime, isActive });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}
