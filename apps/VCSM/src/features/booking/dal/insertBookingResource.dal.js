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

const WRITE_COLUMNS = Object.freeze([
  "owner_actor_id",
  "resource_type",
  "name",
  "is_active",
  "timezone",
  "sort_order",
]);

function pickDefined(input, columns) {
  return columns.reduce((acc, key) => {
    if (input[key] !== undefined) acc[key] = input[key];
    return acc;
  }, {});
}

export async function insertBookingResourceDAL({ row } = {}) {
  if (!row || typeof row !== "object") {
    throw new Error("insertBookingResourceDAL: row is required");
  }
  if (!row.owner_actor_id) {
    throw new Error("insertBookingResourceDAL: owner_actor_id is required");
  }
  if (!row.resource_type) {
    throw new Error("insertBookingResourceDAL: resource_type is required");
  }

  const payload = pickDefined(row, WRITE_COLUMNS);

  const { data, error } = await supabase
    .schema("vc")
    .from("booking_resources")
    .insert(payload)
    .select(BOOKING_RESOURCE_SELECT)
    .single();

  if (error) throw error;
  return data ?? null;
}

export default insertBookingResourceDAL;
