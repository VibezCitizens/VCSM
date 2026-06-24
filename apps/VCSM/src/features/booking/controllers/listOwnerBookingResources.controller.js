import listBookingResourcesByOwnerActorIdDAL from "@/features/booking/dal/listBookingResourcesByOwnerActorId.dal";
import { mapBookingResourceRows } from "@/features/booking/model/bookingResource.model";
import { assertActorOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

export async function listOwnerBookingResourcesController({
  requestActorId,
  ownerActorId,
  includeInactive = false,
} = {}) {
  if (!requestActorId) {
    throw new Error("listOwnerBookingResourcesController: requestActorId is required");
  }
  if (!ownerActorId) {
    throw new Error("listOwnerBookingResourcesController: ownerActorId is required");
  }

  await assertActorOwnsActorController({ requestActorId, targetActorId: ownerActorId });

  const rows = await listBookingResourcesByOwnerActorIdDAL({
    ownerActorId,
    includeInactive,
  });

  return mapBookingResourceRows(rows);
}

export default listOwnerBookingResourcesController;
