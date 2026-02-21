// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\gas\vportStationPriceSettings.read.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Fetch price settings for a vport station (actor-first)
 * DAL — RAW DB ROW (single)
 */
export async function fetchVportStationPriceSettingsDAL({ targetActorId }) {
  if (!targetActorId) {
    return { data: null, error: null };
  }

  return supabase
    .schema("vc")
    .from("vport_station_price_settings")
    .select(
      "target_actor_id,show_community_suggestion,require_sanity_for_suggestion,min_price,max_price,max_delta_abs,max_delta_pct,updated_at"
    )
    .eq("target_actor_id", targetActorId)
    .maybeSingle();
}