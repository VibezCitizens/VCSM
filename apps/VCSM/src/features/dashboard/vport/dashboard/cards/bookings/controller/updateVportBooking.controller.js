import { updateVportBookingDAL } from "@/features/dashboard/vport/dal/write/updateVportBooking.write.dal";
import { getVportBookingByIdDAL } from "@/features/dashboard/vport/dal/read/vportBookingById.read.dal";
import { getVportActorIdByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { listVportBookingsInRangeDAL } from "@/features/dashboard/vport/dal/read/vportBookingsInRange.read.dal";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

const OWNER_STATUSES    = ["cancelled", "completed", "no_show", "confirmed"];
const CUSTOMER_STATUSES = ["cancelled"];

// VPD-V-021: bookings in these states are terminal and must not be mutated.
// Any write attempt against a terminal booking is rejected before auth is checked.
const TERMINAL_STATUSES = ["completed", "cancelled", "no_show"];

const STATUS_TO_EVENT = {
  confirmed: "booking_confirmed",
  cancelled: "booking_cancelled",
};

async function resolveVportActorFromProfileId(profileId) {
  if (!profileId) return null;
  return getVportActorIdByProfileIdDAL({ profileId });
}

export async function updateBookingStatusController({ bookingId, status, callerActorId }) {
  if (!bookingId)     throw new Error("bookingId is required");
  if (!callerActorId) throw new Error("callerActorId is required");
  if (!status)        throw new Error("status is required");

  const booking = await getVportBookingByIdDAL({ bookingId });
  if (!booking) throw new Error("Booking not found.");

  // VPD-V-021: reject any mutation attempt against a terminal booking before
  // resolving ownership. Terminal state is immutable regardless of caller.
  if (TERMINAL_STATUSES.includes(booking.status)) {
    throw new Error(`Booking is already ${booking.status} and cannot be modified.`);
  }

  const vportActorId   = await resolveVportActorFromProfileId(booking.profile_id);
  const customerActorId = booking.customer_actor_id ?? null;
  const isCustomer     = customerActorId && String(callerActorId) === String(customerActorId);

  if (isCustomer) {
    if (!CUSTOMER_STATUSES.includes(status)) {
      throw new Error(`Customers may only cancel bookings. Requested: ${status}`);
    }
  } else {
    if (!OWNER_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    if (!vportActorId) throw new Error("Could not resolve VPORT ownership.");
    await assertActorOwnsVportActorController({
      requestActorId: callerActorId,
      targetActorId: vportActorId,
    });
  }

  const updates = { status };
  if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
  if (status === "completed") updates.completed_at = new Date().toISOString();

  const updated = await updateVportBookingDAL({ bookingId, updates });

  const eventKey = STATUS_TO_EVENT[status];
  if (eventKey && updated?.id) {
    let recipientActorId = null;
    if (isCustomer) {
      recipientActorId = vportActorId;
    } else if (customerActorId) {
      recipientActorId = customerActorId;
    }

    if (recipientActorId) {
      publishVcsmNotification({
        recipientActorId,
        actorId: callerActorId,
        kind: eventKey,
        objectType: "booking",
        objectId: String(updated.id),
        context: {
          serviceLabelSnapshot: updated.service_label_snapshot ?? null,
          startsAt: updated.starts_at ?? null,
          customerName: updated.customer_name ?? null,
          status,
        },
      }).catch((err) => {
        if (import.meta.env.DEV) console.error("[updateBookingStatusController] notification failed:", err);
      });
    }
  }

  return updated;
}

export async function rescheduleBookingController({ bookingId, startsAt, endsAt, resourceId, durationMinutes, callerActorId }) {
  if (!bookingId)     throw new Error("bookingId is required");
  if (!callerActorId) throw new Error("callerActorId is required");
  if (!startsAt)      throw new Error("startsAt is required");
  if (!endsAt)        throw new Error("endsAt is required");

  if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
    throw new Error("startsAt must be before endsAt.");
  }

  const booking = await getVportBookingByIdDAL({ bookingId });
  if (!booking) throw new Error("Booking not found.");

  // VPD-V-021: terminal bookings cannot be rescheduled.
  if (TERMINAL_STATUSES.includes(booking.status)) {
    throw new Error(`Booking is already ${booking.status} and cannot be rescheduled.`);
  }

  const vportActorId = await resolveVportActorFromProfileId(booking.profile_id);
  if (!vportActorId) throw new Error("Could not resolve VPORT ownership.");

  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: vportActorId,
  });

  const targetResourceId = resourceId ?? booking.resource_id;

  const conflicting = await listVportBookingsInRangeDAL({
    resourceId: targetResourceId,
    rangeStart: startsAt,
    rangeEnd: endsAt,
  });
  const hasConflict = conflicting.some((b) => String(b.id) !== String(bookingId));
  if (hasConflict) throw new Error("This time slot conflicts with an existing booking.");

  const updates = {};
  if (startsAt)        updates.starts_at        = startsAt;
  if (endsAt)          updates.ends_at          = endsAt;
  if (targetResourceId) updates.resource_id     = targetResourceId;
  if (durationMinutes) updates.duration_minutes = Number(durationMinutes);

  return updateVportBookingDAL({ bookingId, updates });
}
