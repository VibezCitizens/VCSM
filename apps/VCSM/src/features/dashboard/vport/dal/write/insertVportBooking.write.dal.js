import vportSchema from "@/services/supabase/vportClient";

const SELECT_COLS = "id,profile_id,resource_id,service_id,customer_actor_id,status,source,starts_at,ends_at,timezone,service_label_snapshot,duration_minutes,customer_name,customer_note,created_by_actor_id,created_at,updated_at";

const WRITE_COLS = Object.freeze([
  "profile_id", "resource_id", "service_id", "customer_actor_id",
  "status", "source", "starts_at", "ends_at", "timezone",
  "service_label_snapshot", "duration_minutes",
  "customer_name", "customer_note", "created_by_actor_id",
]);

function pick(input, cols) {
  return cols.reduce((acc, k) => {
    if (input[k] !== undefined) acc[k] = input[k];
    return acc;
  }, {});
}

export async function insertVportBookingDAL({ row } = {}) {
  if (!row?.profile_id)  throw new Error("insertVportBookingDAL: profile_id is required");
  if (!row?.resource_id) throw new Error("insertVportBookingDAL: resource_id is required");
  if (!row?.starts_at)   throw new Error("insertVportBookingDAL: starts_at is required");
  if (!row?.ends_at)     throw new Error("insertVportBookingDAL: ends_at is required");
  if (!row?.timezone)    throw new Error("insertVportBookingDAL: timezone is required");
  if (!row?.service_label_snapshot) throw new Error("insertVportBookingDAL: service_label_snapshot is required");

  const { data, error } = await vportSchema
    .from("bookings")
    .insert(pick(row, WRITE_COLS))
    .select(SELECT_COLS)
    .single();

  if (error) throw error;
  return data ?? null;
}
