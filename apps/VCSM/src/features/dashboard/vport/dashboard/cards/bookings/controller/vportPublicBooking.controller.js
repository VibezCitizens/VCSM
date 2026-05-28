import {
  getVportResourceByIdDAL,
  listVportResourcesByProfileIdDAL,
} from "@/features/dashboard/vport/dal/read/vportResource.read.dal";
import { getVportProfileIdByActorDAL, getVportActorIdByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { readActorVportLinkDAL } from "@/features/dashboard/vport/dal/read/actorVport.read.dal";
import { listVportAvailabilityRulesByResourceIdDAL } from "@/features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal";
import { listVportBookingsInRangeDAL } from "@/features/dashboard/vport/dal/read/vportBookingsInRange.read.dal";
import { getVportServiceByIdDAL } from "@/features/dashboard/vport/dal/read/vportServices.read.dal";
import { insertVportBookingDAL } from "@/features/dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal";
import { publishVcsmNotificationBatch } from "@/features/notifications/adapters/notifications.adapter";

export async function getVportResourceAvailabilityController({ resourceId, rangeStart, rangeEnd }) {
  if (!resourceId) return { rules: [], exceptions: [], bookings: [] };

  const [rules, bookings] = await Promise.all([
    listVportAvailabilityRulesByResourceIdDAL({ resourceId }),
    rangeStart && rangeEnd
      ? listVportBookingsInRangeDAL({ resourceId, rangeStart, rangeEnd })
      : Promise.resolve([]),
  ]);

  return { rules, exceptions: [], bookings };
}

export async function listVportBookingResourcesController({ actorId, includeInactive = false }) {
  if (!actorId) return [];

  const profileId = await getVportProfileIdByActorDAL({ actorId });
  if (!profileId) return [];

  return listVportResourcesByProfileIdDAL({ profileId, includeInactive });
}

export async function createVportPublicBookingController({
  resourceId,
  serviceId = null,
  startsAt,
  endsAt,
  timezone,
  durationMinutes,
  requestActorId = null,
  customerName = null,
  customerNote = null,
} = {}) {
  if (!resourceId) throw new Error("createVportPublicBookingController: resourceId is required");
  if (!startsAt)   throw new Error("createVportPublicBookingController: startsAt is required");
  if (!endsAt)     throw new Error("createVportPublicBookingController: endsAt is required");
  if (!timezone)   throw new Error("createVportPublicBookingController: timezone is required");

  const resource = await getVportResourceByIdDAL({ resourceId });
  if (!resource || resource.is_active !== true) throw new Error("This resource is not available for booking.");

  // requestActorId is intentionally optional — guest/walk-in bookings are supported.
  // When null, the booking is unattributed (customer_actor_id = null, created_by_actor_id = null).
  // customerName + customerNote are still captured for the VPORT owner's records.
  if (requestActorId) {
    const actor = await readActorVportLinkDAL({ actorId: requestActorId });
    if (!actor) throw new Error("Only citizens can book appointments.");
    if (actor.kind !== "user") throw new Error("Switch to your citizen profile to book.");
  }

  if (new Date(startsAt).getTime() <= Date.now()) {
    throw new Error("This time slot is no longer available.");
  }

  // Resolve service label server-side from the catalog — never trust client-supplied snapshot
  let resolvedLabel = "Appointment";
  if (serviceId) {
    const service = await getVportServiceByIdDAL({ serviceId });
    if (service) {
      resolvedLabel = service.label || service.key || "Appointment";
    }
  }

  const booking = await insertVportBookingDAL({
    row: {
      profile_id:             resource.profile_id,
      resource_id:            resourceId,
      service_id:             serviceId,
      // VPD-V-019: customer_actor_id is always the authenticated requestActor.
      // Accepting a caller-supplied customerActorId would allow booking attribution injection.
      // Guest/walk-in bookings (requestActorId = null) produce customer_actor_id = null.
      customer_actor_id:      requestActorId ?? null,
      created_by_actor_id:    requestActorId,
      status:                 "pending",
      source:                 "public",
      starts_at:              startsAt,
      ends_at:                endsAt,
      timezone,
      service_label_snapshot: resolvedLabel,
      duration_minutes:       durationMinutes,
      customer_name:          customerName,
      customer_note:          customerNote,
    },
  });

  const vportActorId   = await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id });
  const memberActorId  = resource.member_actor_id ?? null;

  const recipientSet = new Set();
  if (vportActorId)  recipientSet.add(String(vportActorId));
  if (memberActorId) recipientSet.add(String(memberActorId));
  if (requestActorId) recipientSet.delete(String(requestActorId));

  const recipientActorIds = [...recipientSet];
  if (requestActorId && recipientActorIds.length > 0) {
    publishVcsmNotificationBatch({
      recipientActorIds,
      actorId: requestActorId,
      kind: "booking_created",
      objectType: "booking",
      objectId: booking?.id ? String(booking.id) : null,
      // VPD-V-020: omit linkPath to prevent raw VPORT UUID from being stored in
      // the notification row. The owner's notification inbox provides navigation context.
      linkPath: null,
      context: {
        serviceLabelSnapshot: resolvedLabel,
        startsAt: startsAt ?? null,
        customerName: customerName ?? null,
        status: "pending",
      },
    });
  }

  return booking;
}
