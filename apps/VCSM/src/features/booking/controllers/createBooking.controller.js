import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import getActorByIdDAL from "@/features/booking/dal/getActorById.dal";
import insertBookingDAL from "@/features/booking/dal/insertBooking.dal";
import { listBookingResourceServicesByResourceIdDAL } from "@/features/booking/dal/listBookingResourceServicesByResourceId.dal";
import { assertActorOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { mapBookingRow } from "@/features/booking/model/booking.model";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";

const MANAGEMENT_SOURCES = new Set(["owner", "admin", "import", "sync"]);
const CITIZEN_ONLY_SOURCES = new Set(["public"]);
const ALL_VALID_SOURCES = new Set([...MANAGEMENT_SOURCES, ...CITIZEN_ONLY_SOURCES]);
const MANAGEMENT_VALID_STATUSES = new Set(["pending", "confirmed", "cancelled", "completed", "no_show", "in_progress"]);

const MAX_BOOKING_DURATION_MINUTES = 1440; // 24 hours hard ceiling

export async function createBookingController({
  requestActorId = null,
  resourceId,
  serviceId = null,
  customerActorId = null,
  customerProfileId = null,
  status = null,
  source = "public",
  startsAt,
  endsAt,
  timezone,
  serviceLabelSnapshot,
  durationMinutes,
  customerName = null,
  customerPhone = null,
  customerEmail = null,
  customerNote = null,
  internalNote = null,
} = {}) {
  if (!resourceId) {
    throw new Error("createBookingController: resourceId is required");
  }
  if (!startsAt) {
    throw new Error("createBookingController: startsAt is required");
  }
  if (!endsAt) {
    throw new Error("createBookingController: endsAt is required");
  }
  if (!timezone) {
    throw new Error("createBookingController: timezone is required");
  }
  if (!serviceLabelSnapshot) {
    throw new Error("createBookingController: serviceLabelSnapshot is required");
  }
  if (!durationMinutes) {
    throw new Error("createBookingController: durationMinutes is required");
  }

  if (!ALL_VALID_SOURCES.has(String(source))) {
    throw new Error(`createBookingController: unrecognized source "${String(source)}"`);
  }

  const parsedDuration = Number(durationMinutes);
  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0 || parsedDuration > MAX_BOOKING_DURATION_MINUTES) {
    throw new Error("createBookingController: durationMinutes must be a positive number not exceeding 1440");
  }

  const resource = await getBookingResourceByIdDAL({ resourceId });
  if (!resource || resource.is_active !== true) {
    throw new Error("Booking resource is unavailable.");
  }

  if (serviceId) {
    const resourceServices = await listBookingResourceServicesByResourceIdDAL({ resourceId });
    const isLinked = resourceServices.some((rs) => String(rs.service_id) === String(serviceId));
    if (!isLinked) {
      throw new Error("Booking service is not available for this resource.");
    }
  }

  if (MANAGEMENT_SOURCES.has(String(source))) {
    if (!requestActorId) {
      throw new Error("createBookingController: requestActorId is required for management source");
    }

    await assertActorOwnsActorController({
      requestActorId,
      targetActorId: resource.owner_actor_id,
    });

    // Bind customerActorId for management sources (ELEK-2026-06-07-B001).
    // If not supplied or matches caller, treat as a self-booking by the VPORT owner.
    // If explicitly targeting a different actor, verify that actor is a real, non-void citizen.
    if (!customerActorId || String(customerActorId) === String(requestActorId)) {
      customerActorId = requestActorId;
    } else {
      const customerActor = await getActorByIdDAL({ actorId: customerActorId });
      if (!customerActor || customerActor.kind !== "user" || customerActor.is_void === true) {
        throw new Error("createBookingController: customerActorId is not a valid citizen actor");
      }
    }

    if (status !== null && !MANAGEMENT_VALID_STATUSES.has(String(status))) {
      throw new Error(`createBookingController: unrecognized status "${String(status)}" for management source`);
    }
  }

  if (CITIZEN_ONLY_SOURCES.has(String(source))) {
    if (!requestActorId) {
      throw new Error("Only citizens can book appointments.");
    }

    const requestActor = await getActorByIdDAL({ actorId: requestActorId });
    if (!requestActor || requestActor.is_void === true) {
      throw new Error("Only citizens can book appointments.");
    }
    if (requestActor.kind !== "user") {
      captureVcsmError({
        feature: 'booking',
        module: 'createBooking.controller',
        behavior_id: 'behavior.booking.create_booking',
        severity: 'warning',
        message: 'createBookingController: non-citizen actor attempted public booking — kind gate rejected',
        operation: 'actorKindCheck',
        is_handled: true,
        context: { bookingSource: String(source), actorKind: requestActor.kind ?? null },
      });
      throw new Error("Only citizens can book appointments. Switch to your citizen profile to reserve.");
    }

    // V03B-M1: session-bind the citizen actor. The kind/void checks above only prove
    // requestActorId is *a* citizen — they do NOT prove the authenticated session owns
    // it. The canonical user-only self-form binds requestActorId to the session
    // (asserts vc.actors.profile_id === auth.uid()) so a forged/victim citizen actorId
    // cannot be attributed as customer_actor_id / created_by_actor_id. DiD only; the
    // durable boundary is vport.bookings RLS (03B-DB-1, Phase 15).
    await assertActorOwnsActorController({
      requestActorId,
      targetActorId: requestActorId,
    });

    // Session-bind: customer_actor_id must always equal the verified requestActorId for
    // public bookings. Reject any caller-supplied customerActorId to prevent actor injection.
    customerActorId = requestActorId;
  }

  const slotStartTime = new Date(startsAt).getTime();
  if (!Number.isFinite(slotStartTime) || slotStartTime <= Date.now()) {
    throw new Error("This time slot is no longer available.");
  }

  let inserted;
  try {
    inserted = await insertBookingDAL({
      row: {
        resource_id: resourceId,
        service_id: serviceId,
        customer_actor_id: customerActorId,
        customer_profile_id: customerProfileId,
        status,
        source,
        starts_at: startsAt,
        ends_at: endsAt,
        timezone,
        service_label_snapshot: serviceLabelSnapshot,
        duration_minutes: durationMinutes,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        customer_note: customerNote,
        internal_note: internalNote,
        created_by_actor_id: requestActorId,
      },
    });
  } catch (insertError) {
    captureVcsmError({
      feature: 'booking',
      module: 'createBooking.controller',
      behavior_id: 'behavior.booking.create_booking',
      severity: 'error',
      message: `createBookingController: insertBookingDAL failed — ${insertError?.message ?? 'unknown'}`,
      error_name: insertError?.name,
      stack: insertError?.stack,
      operation: 'insertBookingDAL',
      is_handled: false,
      context: { bookingSource: String(source), resourceFound: true, resourceActive: true, dbErrorCode: insertError?.code ?? null },
    });
    throw insertError;
  }

  const mapped = mapBookingRow(inserted);

  // Notify vport owner when a public booking is created.
  // VPD-V-020: linkPath is omitted to avoid storing the owner's raw actor UUID in
  // the notification row. Consistent with the cancel controller's owner-recipient pattern.
  if (source === "public" && resource.owner_actor_id && requestActorId) {
    if (String(requestActorId) !== String(resource.owner_actor_id)) {
      publishVcsmNotification({
        recipientActorId: resource.owner_actor_id,
        actorId: requestActorId,
        kind: "booking_created",
        objectType: "booking",
        objectId: mapped.id,
        linkPath: null,
        context: {
          serviceLabelSnapshot: serviceLabelSnapshot ?? null,
          startsAt: startsAt ?? null,
          customerName: customerName ?? null,
          status: mapped.status ?? "pending",
        },
      });
    }
  }

  return mapped;
}

export default createBookingController;
