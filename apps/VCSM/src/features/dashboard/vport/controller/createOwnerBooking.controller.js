import { getVportResourceByIdDAL } from "@/features/dashboard/vport/dal/read/vportResource.read.dal";
import { insertVportBookingDAL } from "@/features/dashboard/vport/dal/write/insertVportBooking.write.dal";

export async function createOwnerBookingController({
  actorId,
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
  if (!actorId)    throw new Error("actorId is required");
  if (!resourceId) throw new Error("resourceId is required");
  if (!startsAt)   throw new Error("startsAt is required");
  if (!endsAt)     throw new Error("endsAt is required");

  const resource = await getVportResourceByIdDAL({ resourceId });
  if (!resource?.profile_id) throw new Error("Resource has no associated profile.");

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
      created_by_actor_id:    actorId,
    },
  });
}
