// ============================================================
// Booking — List Booking History Controller
// ============================================================

import listBookingsByResourceDAL from "@/features/booking/dal/listBookingsByResource.dal";
import { mapBookingRows } from "@/features/booking/model/booking.model";

/**
 * Fetch booking history for a resource with optional status filter.
 */
export async function listBookingHistoryController({
  resourceId,
  statuses = null,
  limit = 50,
  offset = 0,
} = {}) {
  if (!resourceId) {
    throw new Error("listBookingHistoryController: resourceId is required");
  }

  const rows = await listBookingsByResourceDAL({ resourceId, statuses, limit, offset });
  return {
    bookings: mapBookingRows(rows),
    hasMore: rows.length >= limit,
  };
}

export default listBookingHistoryController;
