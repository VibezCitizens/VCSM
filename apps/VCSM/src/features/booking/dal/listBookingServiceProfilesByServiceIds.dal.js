import { supabase } from "@/services/supabase/supabaseClient";

const BOOKING_SERVICE_PROFILE_SELECT = [
  "service_id",
  "duration_minutes",
  "padding_before_minutes",
  "padding_after_minutes",
  "booking_mode",
  "max_concurrent",
  "is_bookable",
  "price_cents",
  "currency_code",
  "created_at",
  "updated_at",
].join(",");

function normalizeServiceIds(serviceIds) {
  return [...new Set((Array.isArray(serviceIds) ? serviceIds : []).filter(Boolean).map(String))];
}

export async function listBookingServiceProfilesByServiceIdsDAL({
  serviceIds,
  includeNonBookable = false,
} = {}) {
  const ids = normalizeServiceIds(serviceIds);
  if (!ids.length) return [];

  let query = supabase
    .schema("vc")
    .from("booking_service_profiles")
    .select(BOOKING_SERVICE_PROFILE_SELECT)
    .in("service_id", ids)
    .order("created_at", { ascending: true });

  if (!includeNonBookable) {
    query = query.eq("is_bookable", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

export default listBookingServiceProfilesByServiceIdsDAL;
