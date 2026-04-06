import getBookingByIdDAL from "@/features/booking/dal/getBookingById.dal";
import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import updateBookingStatusDAL from "@/features/booking/dal/updateBookingStatus.dal";
import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";
import { mapBookingRow } from "@/features/booking/model/booking.model";

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

  if (!isCustomer) {
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

  return mapBookingRow(updated);
}

export default cancelBookingController;
