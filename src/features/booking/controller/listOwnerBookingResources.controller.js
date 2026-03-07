import listBookingResourcesByOwnerActorIdDAL from "@/features/booking/dal/listBookingResourcesByOwnerActorId.dal";
import { mapBookingResourceRows } from "@/features/booking/model/bookingResource.model";

export async function listOwnerBookingResourcesController({
  ownerActorId,
  includeInactive = false,
} = {}) {
  if (!ownerActorId) {
    throw new Error("listOwnerBookingResourcesController: ownerActorId is required");
  }

  const rows = await listBookingResourcesByOwnerActorIdDAL({
    ownerActorId,
    includeInactive,
  });

  return mapBookingResourceRows(rows);
}

export default listOwnerBookingResourcesController;
