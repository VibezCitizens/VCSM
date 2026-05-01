import { useCallback } from "react";
import { manageVportAvailabilityRuleController } from "@/features/dashboard/vport/controller/manageVportAvailabilityRule.controller";

export default function useVportManageAvailability() {
  const setAvailabilityRule = useCallback(async ({
    requestActorId,
    ruleId,
    resourceId,
    ruleType,
    weekday,
    startTime,
    endTime,
    isActive,
  }) => {
    return manageVportAvailabilityRuleController({
      ruleId,
      resourceId,
      ruleType,
      weekday,
      startTime,
      endTime,
      isActive,
    });
  }, []);

  return { setAvailabilityRule };
}
