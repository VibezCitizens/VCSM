import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import getActorByIdDAL from "@/features/booking/dal/getActorById.dal";
import insertBookingDAL from "@/features/booking/dal/insertBooking.dal";
import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import { mapBookingRow } from "@/features/booking/model/booking.model";
import { publishVcsmNotification } from "@/features/notifications/publish";

const MANAGEMENT_SOURCES = new Set(["owner", "admin", "import", "sync"]);
const CITIZEN_ONLY_SOURCES = new Set(["public"]);

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

  const resource = await getBookingResourceByIdDAL({ resourceId });
  if (!resource || resource.is_active !== true) {
    throw new Error("Booking resource is unavailable.");
  }

  if (MANAGEMENT_SOURCES.has(String(source))) {
    if (!requestActorId) {
      throw new Error("createBookingController: requestActorId is required for management source");
    }

    await assertActorOwnsVportActorController({
      requestActorId,
      targetActorId: resource.owner_actor_id,
    });
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
      throw new Error("Only citizens can book appointments. Switch to your citizen profile to reserve.");
    }
  }

  const slotStartTime = new Date(startsAt).getTime();
  if (!Number.isFinite(slotStartTime) || slotStartTime <= Date.now()) {
    throw new Error("This time slot is no longer available.");
  }

  const inserted = await insertBookingDAL({
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

  const mapped = mapBookingRow(inserted);

  // Notify vport owner when a public booking is created
  if (source === "public" && resource.owner_actor_id && requestActorId) {
    if (String(requestActorId) !== String(resource.owner_actor_id)) {
      publishVcsmNotification({
        recipientActorId: resource.owner_actor_id,
        actorId: requestActorId,
        kind: "booking_created",
        objectType: "booking",
        objectId: mapped.id,
        linkPath: `/profile/${resource.owner_actor_id}?tab=book`,
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
