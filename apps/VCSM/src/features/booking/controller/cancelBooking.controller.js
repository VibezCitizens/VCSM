import getBookingByIdDAL from "@/features/booking/dal/getBookingById.dal";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import updateBookingStatusDAL from "@/features/booking/dal/updateBookingStatus.dal";
import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import { mapBookingRow } from "@/features/booking/model/booking.model";
import { publishVcsmNotification } from "@/features/notifications/publish";

export async function cancelBookingController({
  bookingId,
  requestActorId,
  cancelNote = undefined,
} = {}) {
  if (!bookingId) {
    throw new Error("cancelBookingController: bookingId is required");
  }
  if (!requestActorId) {
    throw new Error("cancelBookingController: requestActorId is required");
  }

  const booking = await getBookingByIdDAL({ bookingId });
  if (!booking) {
    throw new Error("Booking not found.");
  }

  const isCustomer =
    booking.customer_actor_id &&
    String(booking.customer_actor_id) === String(requestActorId);

  const resource = await getBookingResourceByIdDAL({
    resourceId: booking.resource_id,
  });

  if (!isCustomer) {
    if (!resource) {
      throw new Error("Booking resource not found.");
    }

    await assertActorOwnsVportActorController({
      requestActorId,
      targetActorId: resource.owner_actor_id,
    });
  }

  const updated = await updateBookingStatusDAL({
    bookingId,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    completedAt: null,
    internalNote: cancelNote,
  });

  if (!updated) {
    throw new Error("Failed to cancel booking.");
  }

  const mapped = mapBookingRow(updated);

  // Notify the other party about cancellation
  const recipientActorId = isCustomer
    ? resource?.owner_actor_id
    : booking.customer_actor_id;

  if (recipientActorId && String(requestActorId) !== String(recipientActorId)) {
    publishVcsmNotification({
      recipientActorId,
      actorId: requestActorId,
      kind: "booking_cancelled",
      objectType: "booking",
      objectId: bookingId,
      linkPath: isCustomer
        ? `/profile/${resource.owner_actor_id}?tab=book`
        : `/profile/${resource?.owner_actor_id ?? ""}?tab=book`,
      context: {
        serviceLabelSnapshot: booking.service_label_snapshot ?? null,
        startsAt: booking.starts_at ?? null,
        status: "cancelled",
        cancelledBy: isCustomer ? "customer" : "owner",
      },
    });
  }

  return mapped;
}

export default cancelBookingController;
