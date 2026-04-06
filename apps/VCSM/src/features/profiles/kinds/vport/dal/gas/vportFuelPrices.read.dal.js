// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\gas\vportFuelPrices.read.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Fetch official fuel prices for a vport (actor-first)
 * DAL — RAW DB ROWS
 */
export async function fetchVportFuelPricesDAL({ targetActorId }) {
  if (!targetActorId) {
    return { data: [], error: null };
  }

  return supabase
    .schema("vc")
    .from("vport_fuel_prices")
    .select(
      "target_actor_id,fuel_key,price,currency_code,unit,is_available,updated_at,updated_by_actor_id,source"
    )
    .eq("target_actor_id", targetActorId)
    .order("fuel_key", { ascending: true });
}