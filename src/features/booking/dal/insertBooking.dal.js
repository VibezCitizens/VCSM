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

const BOOKING_INSERT_COLUMNS = Object.freeze([
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
]);

function pickDefined(input, columns) {
  return columns.reduce((acc, key) => {
    if (input[key] !== undefined) acc[key] = input[key];
    return acc;
  }, {});
}

export async function insertBookingDAL(args = {}) {
  const row = args?.row && typeof args.row === "object" ? args.row : args;

  if (!row?.resource_id) {
    throw new Error("insertBookingDAL: resource_id is required");
  }
  if (!row?.starts_at) {
    throw new Error("insertBookingDAL: starts_at is required");
  }
  if (!row?.ends_at) {
    throw new Error("insertBookingDAL: ends_at is required");
  }
  if (!row?.timezone) {
    throw new Error("insertBookingDAL: timezone is required");
  }
  if (!row?.service_label_snapshot) {
    throw new Error("insertBookingDAL: service_label_snapshot is required");
  }
  if (row?.duration_minutes == null) {
    throw new Error("insertBookingDAL: duration_minutes is required");
  }

  const payload = pickDefined(row, BOOKING_INSERT_COLUMNS);

  const { data, error } = await supabase
    .schema("vc")
    .from("bookings")
    .insert(payload)
    .select(BOOKING_SELECT)
    .single();

  if (error) throw error;
  return data ?? null;
}

export default insertBookingDAL;
