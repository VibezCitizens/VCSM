import { vport as vportClient } from "@/services/supabase/vportClient";

const AVAILABILITY_EXCEPTION_SELECT = ["id", "resource_id"].join(",");

export async function getAvailabilityExceptionByIdDAL({ exceptionId } = {}) {
  if (!exceptionId) {
    throw new Error("getAvailabilityExceptionByIdDAL: exceptionId is required");
  }

  const { data, error } = await vportClient
    .from("availability_exceptions")
    .select(AVAILABILITY_EXCEPTION_SELECT)
    .eq("id", exceptionId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default getAvailabilityExceptionByIdDAL;
