import listBookingsByCustomerDAL from "@/features/booking/dal/listBookingsByCustomer.dal";
import { mapBookingRows } from "@/features/booking/model/booking.model";
import { getActorSummariesByIdsDAL } from "@hydration";

export async function listMyBookingsController({ actorId } = {}) {
  if (!actorId) throw new Error("listMyBookingsController: actorId is required");

  const raw = await listBookingsByCustomerDAL({ actorId });
  const bookings = mapBookingRows(raw);

  const ownerIds = [...new Set(bookings.map((b) => b.ownerActorId).filter(Boolean))];
  let ownerNames = {};

  if (ownerIds.length > 0) {
    const { rows: summaries } = await getActorSummariesByIdsDAL({ actorIds: ownerIds });
    (summaries ?? []).forEach((s) => {
      ownerNames[s.actor_id] = {
        name: s.display_name || s.vport_name || s.username || null,
        avatar: s.vport_avatar_url || s.photo_url || null,
      };
    });
  }

  return { bookings, ownerNames };
}

export default listMyBookingsController;
