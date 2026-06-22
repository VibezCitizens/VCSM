import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";
import assertActorOwnsVportActorController from "@/features/booking/controllers/assertActorOwnsVportActor.controller";
import insertBookingResourceDAL from "@/features/booking/dal/insertBookingResource.dal";
import listBookingResourcesByOwnerActorIdDAL from "@/features/booking/dal/listBookingResourcesByOwnerActorId.dal";
import { mapBookingResourceRow } from "@/features/booking/model/bookingResource.model";

function pickPrimaryOrFirst(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return (
    rows.find((x) => x?.resource_type === "primary") ??
    rows.find((x) => x?.is_active === true) ??
    rows[0]
  );
}

export async function ensureOwnerBookingResourceController({
  requestActorId,
  ownerActorId,
  timezone = "UTC",
} = {}) {
  if (!requestActorId) {
    throw new Error("ensureOwnerBookingResourceController: requestActorId is required");
  }
  if (!ownerActorId) {
    throw new Error("ensureOwnerBookingResourceController: ownerActorId is required");
  }

  await assertActorOwnsVportActorController({
    requestActorId,
    targetActorId: ownerActorId,
  });

  const existingRows = await listBookingResourcesByOwnerActorIdDAL({
    ownerActorId,
    includeInactive: true,
  });
  const existing = pickPrimaryOrFirst(existingRows);
  if (existing) return mapBookingResourceRow(existing);

  try {
    const inserted = await insertBookingResourceDAL({
      row: {
        owner_actor_id: ownerActorId,
        resource_type: "primary",
        name: "Default calendar",
        is_active: true,
        timezone: timezone || "UTC",
        sort_order: 0,
      },
    });

    return mapBookingResourceRow(inserted);
  } catch (error) {
    // If another request created it first, load existing and continue.
    const rowsAfter = await listBookingResourcesByOwnerActorIdDAL({
      ownerActorId,
      includeInactive: true,
    });
    const after = pickPrimaryOrFirst(rowsAfter);
    if (after) return mapBookingResourceRow(after);
    captureVcsmError({
      feature: 'booking',
      module: 'ensureOwnerBookingResource.controller',
      behavior_id: 'behavior.booking.resource_provision',
      severity: 'error',
      message: `ensureOwnerBookingResourceController: insertBookingResourceDAL failed and retry found no rows — ${error?.message ?? 'unknown'}`,
      error_name: error?.name,
      stack: error?.stack,
      operation: 'insertBookingResourceDAL',
      is_handled: false,
      context: { resourceFound: false, retryAttempted: true, dbErrorCode: error?.code ?? null },
    });
    throw error;
  }
}

export default ensureOwnerBookingResourceController;
