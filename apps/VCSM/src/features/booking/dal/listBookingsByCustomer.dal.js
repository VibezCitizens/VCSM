import { supabase } from "@/services/supabase/supabaseClient";
import { vport as vportClient } from "@/services/supabase/vportClient";

const VC_BOOKING_SELECT = [
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
  "created_at",
  "updated_at",
  "booking_resources!resource_id(owner_actor_id)",
].join(",");

const VPORT_BOOKING_SELECT = [
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
  "resources!resource_id(owner_actor_id)",
].join(",");

export async function listBookingsByCustomerDAL({ actorId, limit = 60 } = {}) {
  if (!actorId) throw new Error("listBookingsByCustomerDAL: actorId is required");

  const [vcResult, vportResult] = await Promise.all([
    supabase
      .schema("vc")
      .from("bookings")
      .select(VC_BOOKING_SELECT)
      .eq("customer_actor_id", actorId)
      .order("starts_at", { ascending: false })
      .limit(limit),
    vportClient
      .from("bookings")
      .select(VPORT_BOOKING_SELECT)
      .eq("customer_actor_id", actorId)
      .order("starts_at", { ascending: false })
      .limit(limit),
  ]);

  if (vcResult.error) throw vcResult.error;
  if (vportResult.error) throw vportResult.error;

  const combined = [
    ...(Array.isArray(vcResult.data) ? vcResult.data : []),
    ...(Array.isArray(vportResult.data) ? vportResult.data : []),
  ]
    .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at))
    .slice(0, limit);

  return combined;
}

export default listBookingsByCustomerDAL;
