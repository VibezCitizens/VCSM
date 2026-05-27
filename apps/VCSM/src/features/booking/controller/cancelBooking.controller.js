import getBookingByIdDAL from "@/features/booking/dal/getBookingById.dal";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import updateBookingStatusDAL from "@/features/booking/dal/updateBookingStatus.dal";
import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import { mapBookingRow } from "@/features/booking/model/booking.model";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
import { getVportSlugByActorIdDAL } from "@/features/booking/dal/getVportSlugByActorId.dal";

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
    // VPD-V-020: construct linkPath without raw UUID exposure.
    //
    // Owner notification (customer cancels): the owner receives a link to their
    // own dashboard. Their actorId is not sensitive to themselves, but we omit it
    // from the stored notification row to avoid UUID enumeration via DB reads.
    //
    // Customer notification (owner cancels): the customer receives a link to the
    // VPORT's public profile using its slug. If the slug is unavailable, the
    // linkPath is omitted rather than falling back to the raw UUID.
    let linkPath = null;
    if (!isCustomer && resource?.owner_actor_id) {
      // Owner cancelled — recipient is the customer. Fetch slug to avoid UUID in linkPath.
      const ownerSlug = await getVportSlugByActorIdDAL({ actorId: resource.owner_actor_id });
      linkPath = ownerSlug ? `/profile/${ownerSlug}?tab=book` : null;
    }
    // isCustomer case: owner is the recipient and knows their own actorId.
    // We omit the dashboard path to avoid storing UUIDs in notification rows.

    publishVcsmNotification({
      recipientActorId,
      actorId: requestActorId,
      kind: "booking_cancelled",
      objectType: "booking",
      objectId: bookingId,
      linkPath,
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
