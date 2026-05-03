// ============================================================
// Booking — List All Bookings by Resource DAL
// ============================================================

import { vport as vportClient } from "@/services/supabase/vportClient";

const BOOKING_SELECT = [
  "id",
  "resource_id",
  "service_id",
  "customer_actor_id",
  "customer_profile_id",
  "status",
  "source",
  "starts_at",
  "ends_at",
  "timezone",
  "service_label_snapshot",
  "duration_minutes",
  "customer_name",
  "customer_phone",
  "customer_email",
  "customer_note",
  "internal_note",
  "cancelled_at",
  "completed_at",
  "created_by_actor_id",
  "created_at",
  "updated_at",
].join(",");

/**
 * List bookings for a resource with optional status filter and pagination.
 * Ordered by starts_at DESC (most recent first).
 */
export async function listBookingsByResourceDAL({
  resourceId,
  statuses = null,
  limit = 50,
  offset = 0,
} = {}) {
  if (!resourceId) {
    throw new Error("listBookingsByResourceDAL: resourceId is required");
  }

  let query = vportClient
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("resource_id", resourceId)
    .order("starts_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const statusList = Array.isArray(statuses) ? statuses.filter(Boolean) : [];
  if (statusList.length > 0) {
    query = query.in("status", statusList);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

export default listBookingsByResourceDAL;
