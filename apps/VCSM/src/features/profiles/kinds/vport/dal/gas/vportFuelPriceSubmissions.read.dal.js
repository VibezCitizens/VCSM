// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\gas\vportFuelPriceSubmissions.read.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * List pending submissions for a vport (actor-first)
 * DAL — RAW DB ROWS
 */
export async function fetchPendingFuelPriceSubmissionsDAL({
  targetActorId,
  fuelKey = null,
  limit = 50,
}) {
  if (!targetActorId) {
    return { data: [], error: null };
  }

  let query = supabase
    .schema("vc")
    .from("vport_fuel_price_submissions")
    .select(
      "id,target_actor_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,evidence"
    )
    .eq("target_actor_id", targetActorId)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (fuelKey) {
    query = query.eq("fuel_key", fuelKey);
  }

  return query;
}

/**
 * Fetch a single submission by id
 * DAL — RAW DB ROW
 */
export async function fetchFuelPriceSubmissionByIdDAL({ submissionId }) {
  if (!submissionId) {
    return { data: null, error: null };
  }

  return supabase
    .schema("vc")
    .from("vport_fuel_price_submissions")
    .select(
      "id,target_actor_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,reviewed_at,reviewed_by_actor_id,decision_reason,evidence"
    )
    .eq("id", submissionId)
    .maybeSingle();
}