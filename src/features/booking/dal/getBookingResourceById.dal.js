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

export async function getBookingResourceByIdDAL({
  resourceId,
  ownerActorId = null,
} = {}) {
  if (!resourceId) {
    throw new Error("getBookingResourceByIdDAL: resourceId is required");
  }

  let query = supabase
    .schema("vc")
    .from("booking_resources")
    .select(BOOKING_RESOURCE_SELECT)
    .eq("id", resourceId);

  if (ownerActorId) {
    query = query.eq("owner_actor_id", ownerActorId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;

  return data ?? null;
}

export default getBookingResourceByIdDAL;
