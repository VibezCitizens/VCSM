import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import upsertAvailabilityRuleDAL from "@/features/booking/dal/upsertAvailabilityRule.dal";
import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import { mapAvailabilityRuleRow } from "@/features/booking/model/bookingAvailability.model";

export async function setAvailabilityRuleController({
  requestActorId,
  ruleId = null,
  resourceId,
  ruleType = "weekly",
  weekday,
  startTime,
  endTime,
  validFrom = undefined,
  validUntil = undefined,
  isActive = undefined,
} = {}) {
  if (!requestActorId) {
    throw new Error("setAvailabilityRuleController: requestActorId is required");
  }
  if (!resourceId) {
    throw new Error("setAvailabilityRuleController: resourceId is required");
  }
  if (weekday == null) {
    throw new Error("setAvailabilityRuleController: weekday is required");
  }
  if (!startTime) {
    throw new Error("setAvailabilityRuleController: startTime is required");
  }
  if (!endTime) {
    throw new Error("setAvailabilityRuleController: endTime is required");
  }

  const resource = await getBookingResourceByIdDAL({ resourceId });
  if (!resource) {
    throw new Error("Booking resource not found.");
  }

  await assertActorOwnsVportActorController({
    requestActorId,
    targetActorId: resource.owner_actor_id,
  });

  const saved = await upsertAvailabilityRuleDAL({
    row: {
      id: ruleId ?? undefined,
      resource_id: resourceId,
      rule_type: ruleType,
      weekday,
      start_time: startTime,
      end_time: endTime,
      valid_from: validFrom,
      valid_until: validUntil,
      is_active: isActive,
    },
  });

  return mapAvailabilityRuleRow(saved);
}

export default setAvailabilityRuleController;
