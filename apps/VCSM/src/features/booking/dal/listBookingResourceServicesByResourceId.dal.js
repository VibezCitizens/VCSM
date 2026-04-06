import { supabase } from "@/services/supabase/supabaseClient";

const BOOKING_RESOURCE_SERVICE_SELECT = [
  "resource_id",
  "service_id",
  "is_active",
  "created_at",
].join(",");

export async function listBookingResourceServicesByResourceIdDAL({
  resourceId,
  includeInactive = false,
} = {}) {
  if (!resourceId) {
    throw new Error("listBookingResourceServicesByResourceIdDAL: resourceId is required");
  }

  let query = supabase
    .schema("vc")
    .from("booking_resource_services")
    .select(BOOKING_RESOURCE_SERVICE_SELECT)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

export default listBookingResourceServicesByResourceIdDAL;
