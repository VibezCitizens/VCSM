import { supabase } from "@/services/supabase/supabaseClient";

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

function asTimestampInput(value, fieldName) {
  if (!value) {
    throw new Error(`listBookingsInRangeDAL: ${fieldName} is required`);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`listBookingsInRangeDAL: ${fieldName} is invalid`);
    }
    return value.toISOString();
  }

  return String(value);
}

export async function listBookingsInRangeDAL({
  resourceId,
  rangeStart,
  rangeEnd,
  statuses = null,
} = {}) {
  if (!resourceId) {
    throw new Error("listBookingsInRangeDAL: resourceId is required");
  }

  const startIso = asTimestampInput(rangeStart, "rangeStart");
  const endIso = asTimestampInput(rangeEnd, "rangeEnd");

  let query = supabase
    .schema("vc")
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("resource_id", resourceId)
    .lt("starts_at", endIso)
    .gt("ends_at", startIso)
    .order("starts_at", { ascending: true })
    .order("created_at", { ascending: true });

  const statusList = Array.isArray(statuses) ? statuses.filter(Boolean) : [];
  if (statusList.length > 0) {
    query = query.in("status", statusList);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

export default listBookingsInRangeDAL;
