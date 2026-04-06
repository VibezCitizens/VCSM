import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import upsertAvailabilityExceptionDAL from "@/features/booking/dal/upsertAvailabilityException.dal";
import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import { mapAvailabilityExceptionRow } from "@/features/booking/model/bookingAvailability.model";

export async function setAvailabilityExceptionController({
  requestActorId,
  exceptionId = null,
  resourceId,
  exceptionType,
  startsAt,
  endsAt,
  note = undefined,
} = {}) {
  if (!requestActorId) {
    throw new Error("setAvailabilityExceptionController: requestActorId is required");
  }
  if (!resourceId) {
    throw new Error("setAvailabilityExceptionController: resourceId is required");
  }
  if (!exceptionType) {
    throw new Error("setAvailabilityExceptionController: exceptionType is required");
  }
  if (!startsAt) {
    throw new Error("setAvailabilityExceptionController: startsAt is required");
  }
  if (!endsAt) {
    throw new Error("setAvailabilityExceptionController: endsAt is required");
  }

  const resource = await getBookingResourceByIdDAL({ resourceId });
  if (!resource) {
    throw new Error("Booking resource not found.");
  }

  await assertActorOwnsVportActorController({
    requestActorId,
    targetActorId: resource.owner_actor_id,
  });

  const saved = await upsertAvailabilityExceptionDAL({
    row: {
      id: exceptionId ?? undefined,
      resource_id: resourceId,
      exception_type: exceptionType,
      starts_at: startsAt,
      ends_at: endsAt,
      note,
      created_by_actor_id: requestActorId,
    },
  });

  return mapAvailabilityExceptionRow(saved);
}

export default setAvailabilityExceptionController;
