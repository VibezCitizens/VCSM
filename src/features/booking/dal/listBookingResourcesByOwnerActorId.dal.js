import { supabase } from "@/services/supabase/supabaseClient";

const BOOKING_RESOURCE_SELECT = [
  "id",
  "owner_actor_id",
  "resource_type",
  "name",
  "is_active",
  "timezone",
  "sort_order",
  "created_at",
  "updated_at",
].join(",");

export async function listBookingResourcesByOwnerActorIdDAL({
  ownerActorId,
  includeInactive = false,
} = {}) {
  if (!ownerActorId) {
    throw new Error("listBookingResourcesByOwnerActorIdDAL: ownerActorId is required");
  }

  let query = supabase
    .schema("vc")
    .from("booking_resources")
    .select(BOOKING_RESOURCE_SELECT)
    .eq("owner_actor_id", ownerActorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

export default listBookingResourcesByOwnerActorIdDAL;
