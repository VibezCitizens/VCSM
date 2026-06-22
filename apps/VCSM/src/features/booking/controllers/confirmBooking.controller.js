import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";
import assertActorOwnsVportActorController from "@/features/booking/controllers/assertActorOwnsVportActor.controller";
import getBookingByIdDAL from "@/features/booking/dal/getBookingById.dal";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import updateBookingStatusDAL from "@/features/booking/dal/updateBookingStatus.dal";
import { mapBookingRow } from "@/features/booking/model/booking.model";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
import { getVportSlugByActorIdDAL } from "@/features/booking/dal/getVportSlugByActorId.dal";

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

  const TERMINAL_STATUSES = new Set(['cancelled', 'completed', 'no_show'])
  if (TERMINAL_STATUSES.has(booking.status)) {
    throw new Error('This booking cannot be confirmed — it is already in a terminal state.')
  }

  const updated = await updateBookingStatusDAL({
    bookingId,
    resourceId: booking.resource_id,
    status: "confirmed",
    cancelledAt: null,
    completedAt: null,
    internalNote,
  });

  if (!updated) {
    captureVcsmError({
      feature: 'booking',
      module: 'confirmBooking.controller',
      behavior_id: 'behavior.booking.update_status',
      severity: 'error',
      message: 'confirmBookingController: updateBookingStatusDAL returned null — confirm write failed',
      operation: 'updateBookingStatusDAL',
      is_handled: false,
      context: { bookingFound: true },
    });
    throw new Error("Failed to confirm booking.");
  }

  const mapped = mapBookingRow(updated);

  // Notify customer that their booking was confirmed
  if (booking.customer_actor_id && String(requestActorId) !== String(booking.customer_actor_id)) {
    // VPD-V-020: fetch slug to avoid raw UUID in linkPath stored in notification row.
    const ownerSlug = await getVportSlugByActorIdDAL({ actorId: resource.owner_actor_id });
    publishVcsmNotification({
      recipientActorId: booking.customer_actor_id,
      actorId: requestActorId,
      kind: "booking_confirmed",
      objectType: "booking",
      objectId: bookingId,
      linkPath: ownerSlug ? `/profile/${ownerSlug}?tab=book` : null,
      context: {
        serviceLabelSnapshot: booking.service_label_snapshot ?? null,
        startsAt: booking.starts_at ?? null,
        status: "confirmed",
      },
    });
  }

  return mapped;
}

export default confirmBookingController;
