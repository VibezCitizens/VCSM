import { updateVportBookingDAL } from "@/features/dashboard/vport/dal/write/updateVportBooking.write.dal";
import { getVportActorIdByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"];

const STATUS_TO_EVENT = {
  confirmed: "booking_confirmed",
  cancelled: "booking_cancelled",
};

export async function updateBookingStatusController({ bookingId, status, actorId = null }) {
  if (!bookingId)                       throw new Error("bookingId is required");
  if (!VALID_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);

  const updates = { status };
  if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
  if (status === "completed") updates.completed_at = new Date().toISOString();

  const booking = await updateVportBookingDAL({ bookingId, updates });

  const eventKey = STATUS_TO_EVENT[status];
  if (eventKey && actorId && booking?.id) {
    const customerActorId = booking.customer_actor_id ?? null;
    const isClientActing  = customerActorId && String(actorId) === String(customerActorId);

    let recipientActorId = null;
    if (isClientActing) {
      // Client is acting → notify the vport owner
      recipientActorId = booking.profile_id
        ? await getVportActorIdByProfileIdDAL({ profileId: booking.profile_id })
        : null;
    } else if (customerActorId && String(actorId) !== String(customerActorId)) {
      // Vport is acting → notify the client
      recipientActorId = customerActorId;
    }

    if (recipientActorId) {
      publishVcsmNotification({
        recipientActorId,
        actorId,
        kind: eventKey,
        objectType: "booking",
        objectId: String(booking.id),
        context: {
          serviceLabelSnapshot: booking.service_label_snapshot ?? null,
          startsAt: booking.starts_at ?? null,
          customerName: booking.customer_name ?? null,
          status,
        },
      }).catch((err) => {
        if (import.meta.env.DEV) console.error("[updateBookingStatusController] notification failed:", err);
      });
    }
  }

  return booking;
}

export async function rescheduleBookingController({ bookingId, startsAt, endsAt, resourceId, durationMinutes }) {
  if (!bookingId) throw new Error("bookingId is required");

  const updates = {};
  if (startsAt)        updates.starts_at        = startsAt;
  if (endsAt)          updates.ends_at          = endsAt;
  if (resourceId)      updates.resource_id      = resourceId;
  if (durationMinutes) updates.duration_minutes = Number(durationMinutes);

  return updateVportBookingDAL({ bookingId, updates });
}
