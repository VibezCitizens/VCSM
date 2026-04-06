import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import getBookingByIdDAL from "@/features/booking/dal/getBookingById.dal";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import updateBookingStatusDAL from "@/features/booking/dal/updateBookingStatus.dal";
import { mapBookingRow } from "@/features/booking/model/booking.model";

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

  return mapBookingRow(updated);
}

export default confirmBookingController;
