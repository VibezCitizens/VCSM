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

const EXCEPTION_WRITE_COLUMNS = Object.freeze([
  "id",
  "resource_id",
  "exception_type",
  "starts_at",
  "ends_at",
  "note",
  "created_by_actor_id",
]);

function pickDefined(input, columns) {
  return columns.reduce((acc, key) => {
    if (input[key] !== undefined) acc[key] = input[key];
    return acc;
  }, {});
}

export async function upsertAvailabilityExceptionDAL({ row } = {}) {
  if (!row || typeof row !== "object") {
    throw new Error("upsertAvailabilityExceptionDAL: row is required");
  }
  if (!row.resource_id) {
    throw new Error("upsertAvailabilityExceptionDAL: resource_id is required");
  }
  if (!row.exception_type) {
    throw new Error("upsertAvailabilityExceptionDAL: exception_type is required");
  }
  if (!row.starts_at) {
    throw new Error("upsertAvailabilityExceptionDAL: starts_at is required");
  }
  if (!row.ends_at) {
    throw new Error("upsertAvailabilityExceptionDAL: ends_at is required");
  }

  const payload = pickDefined(row, EXCEPTION_WRITE_COLUMNS);

  const { data, error } = await supabase
    .schema("vc")
    .from("booking_availability_exceptions")
    .upsert(payload, { onConflict: "id" })
    .select(BOOKING_AVAILABILITY_EXCEPTION_SELECT)
    .single();

  if (error) throw error;
  return data ?? null;
}

export default upsertAvailabilityExceptionDAL;
