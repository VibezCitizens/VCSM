import { getVportResourceByIdDAL } from "@/features/vportDashboard/dal/read/vportResource.read.dal";
import { getVportActorIdByProfileIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import { insertVportBookingDAL } from "@/features/vportDashboard/dashboard/cards/bookings/dal/insertVportBooking.write.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

export async function createOwnerBookingController({
  callerActorId,
  resourceId,
  serviceId   = null,
  startsAt,
  endsAt,
  timezone,
  serviceLabelSnapshot,
  durationMinutes,
  customerActorId = null,
  customerName = null,
  customerNote = null,
} = {}) {
  try {
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

    // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): the owner books while
    // acting as the VPORT, so ownership is resolved from the auth session via actor_owners.
    await assertSessionOwnsActorController({ targetActorId: vportActorId });

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
        // customer_actor_id links the booking to a selected Citizen (actor-first). Null for
        // walk-ins. The owner-insert RLS (bookings_insert_actor_owner) does not constrain
        // customer_actor_id, so booking on behalf of a customer is permitted.
        customer_actor_id:      customerActorId ?? null,
        customer_name:          customerName,
        customer_note:          customerNote,
        created_by_actor_id:    callerActorId,
      },
    });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'bookings.createOwnerBooking.controller', severity: 'error', message: `createOwnerBookingController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'createOwnerBooking', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
