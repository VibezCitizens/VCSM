import { vport as vportClient } from "@/services/supabase/vportClient";

const BOOKING_SELECT = [
  "id",
  "resource_id",
  "profile_id",
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

export async function listBookingsByCustomerDAL({ actorId, limit = 60 } = {}) {
  if (!actorId) throw new Error("listBookingsByCustomerDAL: actorId is required");

  const { data, error } = await vportClient
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("customer_actor_id", actorId)
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export default listBookingsByCustomerDAL;
