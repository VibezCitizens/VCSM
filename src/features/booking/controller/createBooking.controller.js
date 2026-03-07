import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import insertBookingDAL from "@/features/booking/dal/insertBooking.dal";
import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import { mapBookingRow } from "@/features/booking/model/booking.model";

const MANAGEMENT_SOURCES = new Set(["owner", "admin", "import", "sync"]);

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

  return mapBookingRow(inserted);
}

export default createBookingController;
