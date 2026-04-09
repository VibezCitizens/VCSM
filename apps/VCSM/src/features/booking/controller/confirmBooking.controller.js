import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import getBookingByIdDAL from "@/features/booking/dal/getBookingById.dal";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import updateBookingStatusDAL from "@/features/booking/dal/updateBookingStatus.dal";
import { mapBookingRow } from "@/features/booking/model/booking.model";
import { dalInsertNotification } from "@/features/notifications/inbox/dal/notifications.create.dal";

export async function confirmBookingController({
  bookingId,
  requestActorId,
  internalNote = undefined,
} = {}) {
  if (!bookingId) {
    throw new Error("confirmBookingController: bookingId is required");
  }
  if (!requestActorId) {
    throw new Error("confirmBookingController: requestActorId is required");
  }

  const booking = await getBookingByIdDAL({ bookingId });
  if (!booking) {
    throw new Error("Booking not found.");
  }

  const resource = await getBookingResourceByIdDAL({
    resourceId: booking.resource_id,
  });
  if (!resource) {
    throw new Error("Booking resource not found.");
  }

  await assertActorOwnsVportActorController({
    requestActorId,
    targetActorId: resource.owner_actor_id,
  });

  const updated = await updateBookingStatusDAL({
    bookingId,
    status: "confirmed",
    cancelledAt: null,
    completedAt: null,
    internalNote,
  });

  if (!updated) {
    throw new Error("Failed to confirm booking.");
  }

  const mapped = mapBookingRow(updated);

  // Notify customer that their booking was confirmed
  if (booking.customer_actor_id && String(requestActorId) !== String(booking.customer_actor_id)) {
    dalInsertNotification({
      recipientActorId: booking.customer_actor_id,
      actorId: requestActorId,
      kind: "booking_confirmed",
      objectType: "booking",
      objectId: bookingId,
      linkPath: `/profile/${resource.owner_actor_id}?tab=book`,
      context: {
        serviceLabelSnapshot: booking.service_label_snapshot ?? null,
        startsAt: booking.starts_at ?? null,
        status: "confirmed",
      },
    }).catch(() => {});
  }

  return mapped;
}

export default confirmBookingController;
