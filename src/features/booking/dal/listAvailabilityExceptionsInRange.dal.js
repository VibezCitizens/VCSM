import { supabase } from "@/services/supabase/supabaseClient";

const BOOKING_AVAILABILITY_EXCEPTION_SELECT = [
  "id",
  "resource_id",
  "exception_type",
  "starts_at",
  "ends_at",
  "note",
  "created_by_actor_id",
  "created_at",
  "updated_at",
].join(",");

function asTimestampInput(value, fieldName) {
  if (!value) {
    throw new Error(`listAvailabilityExceptionsInRangeDAL: ${fieldName} is required`);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`listAvailabilityExceptionsInRangeDAL: ${fieldName} is invalid`);
    }
    return value.toISOString();
  }

  return String(value);
}

export async function listAvailabilityExceptionsInRangeDAL({
  resourceId,
  rangeStart,
  rangeEnd,
  exceptionTypes = null,
} = {}) {
  if (!resourceId) {
    throw new Error("listAvailabilityExceptionsInRangeDAL: resourceId is required");
  }

  const startIso = asTimestampInput(rangeStart, "rangeStart");
  const endIso = asTimestampInput(rangeEnd, "rangeEnd");

  let query = supabase
    .schema("vc")
    .from("booking_availability_exceptions")
    .select(BOOKING_AVAILABILITY_EXCEPTION_SELECT)
    .eq("resource_id", resourceId)
    .lt("starts_at", endIso)
    .gt("ends_at", startIso)
    .order("starts_at", { ascending: true })
    .order("created_at", { ascending: true });

  const types = Array.isArray(exceptionTypes)
    ? exceptionTypes.filter(Boolean)
    : [];

  if (types.length > 0) {
    query = query.in("exception_type", types);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

export default listAvailabilityExceptionsInRangeDAL;
