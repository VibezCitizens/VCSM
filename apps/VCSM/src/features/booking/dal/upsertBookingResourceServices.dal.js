import { supabase } from "@/services/supabase/supabaseClient";

const BOOKING_RESOURCE_SERVICE_SELECT = [
  "resource_id",
  "service_id",
  "is_active",
  "created_at",
].join(",");

function normalizeRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.resource_id && row?.service_id)
    .map((row) => ({
      resource_id: String(row.resource_id),
      service_id: String(row.service_id),
      is_active: row.is_active !== false,
    }));
}

export async function upsertBookingResourceServicesDAL({ rows } = {}) {
  const payload = normalizeRows(rows);
  if (!payload.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("booking_resource_services")
    .upsert(payload, { onConflict: "resource_id,service_id" })
    .select(BOOKING_RESOURCE_SERVICE_SELECT);
  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

export default upsertBookingResourceServicesDAL;
