import { vport as vportClient } from "@/services/supabase/vportClient";

const BOOKING_SELECT = [
  "id",
  "resource_id",
  "service_id",
  "customer_actor_id",
  "status",
  "source",
  "starts_at",
  "ends_at",
  "timezone",
  "service_label_snapshot",
  "duration_minutes",
  "customer_name",
  "customer_note",
  "cancelled_at",
  "completed_at",
  "created_by_actor_id",
  "created_at",
  "updated_at",
  "resources!resource_id(owner_actor_id,name)",
  "profiles!profile_id(actor_id,name)",
].join(",");

export async function listBookingsByCustomerDAL({ actorId, startsAtFrom = null, startsAtTo = null, limit = 60 } = {}) {
  if (!actorId) throw new Error("listBookingsByCustomerDAL: actorId is required");

  let query = vportClient
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("customer_actor_id", actorId);

  // Optional window: `startsAtFrom` (>=) keeps current-month + upcoming bookings;
  // `startsAtTo` (<) selects previous (older-than-current-month) appointments,
  // which the citizen loads on demand via the "Previous appointments" pill.
  if (startsAtFrom) query = query.gte("starts_at", startsAtFrom);
  if (startsAtTo)   query = query.lt("starts_at", startsAtTo);

  const { data, error } = await query
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export default listBookingsByCustomerDAL;
