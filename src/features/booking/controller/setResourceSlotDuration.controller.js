import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import listBookingResourceServicesByResourceIdDAL from "@/features/booking/dal/listBookingResourceServicesByResourceId.dal";
import saveBookingServiceProfileDurationsByServiceIdsDAL from "@/features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal";
import upsertBookingResourceServicesDAL from "@/features/booking/dal/upsertBookingResourceServices.dal";
import { mapBookingServiceProfileRows } from "@/features/booking/model/bookingServiceProfile.model";
import readVportServicesByActor from "@/features/profiles/kinds/vport/dal/services/readVportServicesByActor";

function normalizeDurationMinutes(value, fallback = 30) {
  const minutes = Math.floor(Number(value));
  if (!Number.isFinite(minutes) || minutes < 5) return fallback;
  return Math.min(240, minutes);
}

export async function setResourceSlotDurationController({
  requestActorId,
  resourceId,
  durationMinutes,
} = {}) {
  if (!requestActorId) {
    throw new Error("setResourceSlotDurationController: requestActorId is required");
  }
  if (!resourceId) {
    throw new Error("setResourceSlotDurationController: resourceId is required");
  }

  const normalizedDuration = normalizeDurationMinutes(durationMinutes, 30);
  const resource = await getBookingResourceByIdDAL({ resourceId });
  if (!resource) {
    throw new Error("Booking resource not found.");
  }

  await assertActorOwnsVportActorController({
    requestActorId,
    targetActorId: resource.owner_actor_id,
  });

  const resourceServices = await listBookingResourceServicesByResourceIdDAL({
    resourceId,
    includeInactive: true,
  });
  let serviceIds = [...new Set(
    (Array.isArray(resourceServices) ? resourceServices : [])
      .map((row) => row?.service_id)
      .filter(Boolean)
      .map(String)
  )];

  if (!serviceIds.length) {
    const vportServices = await readVportServicesByActor({
      actorId: resource.owner_actor_id,
      includeDisabled: true,
    });

    const enabledServiceIds = [...new Set(
      (Array.isArray(vportServices) ? vportServices : [])
        .filter((row) => row?.enabled === true)
        .map((row) => row?.id)
        .filter(Boolean)
        .map(String)
    )];
    const anyServiceIds = [...new Set(
      (Array.isArray(vportServices) ? vportServices : [])
        .map((row) => row?.id)
        .filter(Boolean)
        .map(String)
    )];

    serviceIds = enabledServiceIds.length ? enabledServiceIds : anyServiceIds;
  }

  if (!serviceIds.length) {
    throw new Error("No enabled services found yet. Add at least one service, then save duration.");
  }

  await upsertBookingResourceServicesDAL({
    rows: serviceIds.map((serviceId) => ({
      resource_id: resourceId,
      service_id: serviceId,
      is_active: true,
    })),
  });

  const savedRows = await saveBookingServiceProfileDurationsByServiceIdsDAL({
    serviceIds,
    durationMinutes: normalizedDuration,
  });

  return {
    resourceId,
    durationMinutes: normalizedDuration,
    serviceIds,
    serviceProfiles: mapBookingServiceProfileRows(savedRows),
  };
}

export default setResourceSlotDurationController;
