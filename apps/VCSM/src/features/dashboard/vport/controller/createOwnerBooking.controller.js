import { getVportResourceByIdDAL } from "@/features/dashboard/vport/dal/read/vportResource.read.dal";
import { getVportActorIdByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { insertVportBookingDAL } from "@/features/dashboard/vport/dal/write/insertVportBooking.write.dal";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

export async function createOwnerBookingController({
  callerActorId,
  resourceId,
  serviceId   = null,
  startsAt,
  endsAt,
  timezone,
  serviceLabelSnapshot,
  durationMinutes,
  customerName = null,
  customerNote = null,
} = {}) {
  if (!callerActorId) throw new Error("callerActorId is required");
  if (!resourceId)    throw new Error("resourceId is required");
  if (!startsAt)      throw new Error("startsAt is required");
  if (!endsAt)        throw new Error("endsAt is required");

  if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
    throw new Error("startsAt must be before endsAt.");
  }

  const resource = await getVportResourceByIdDAL({ resourceId });
  if (!resource?.profile_id) throw new Error("Resource has no associated profile.");

  const vportActorId = resource.owner_actor_id
    ?? await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id });

  if (!vportActorId) throw new Error("Could not resolve VPORT ownership.");

  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: vportActorId,
  });

  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return insertVportBookingDAL({
    row: {
      profile_id:             resource.profile_id,
      resource_id:            resourceId,
      service_id:             serviceId,
      status:                 "confirmed",
      source:                 "owner",
      starts_at:              startsAt,
      ends_at:                endsAt,
      timezone:               tz,
      service_label_snapshot: serviceLabelSnapshot || "Appointment",
      duration_minutes:       Number(durationMinutes) || 30,
      customer_name:          customerName,
      customer_note:          customerNote,
      created_by_actor_id:    callerActorId,
    },
  });
}
