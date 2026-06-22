import { vport as vportClient } from "@/services/supabase/vportClient";

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

  if (payload.id) {
    // Update existing exception — scope to both id AND resource_id to prevent
    // cross-resource hijack via a known foreign exceptionId (ELEK-2026-06-04-002).
    const { data, error } = await vportClient
      .from("availability_exceptions")
      .update(payload)
      .eq("id", payload.id)
      .eq("resource_id", payload.resource_id)
      .select(BOOKING_AVAILABILITY_EXCEPTION_SELECT)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("upsertAvailabilityExceptionDAL: exception not found or does not belong to this resource");
    return data;
  }

  const { data, error } = await vportClient
    .from("availability_exceptions")
    .insert(payload)
    .select(BOOKING_AVAILABILITY_EXCEPTION_SELECT)
    .single();

  if (error) throw error;
  return data ?? null;
}

export default upsertAvailabilityExceptionDAL;
