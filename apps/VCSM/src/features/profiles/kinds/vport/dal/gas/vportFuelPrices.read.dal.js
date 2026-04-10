import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

const fuelPriceCache = createTTLCache(60_000); // 60 seconds

export async function fetchVportFuelPricesDAL({ targetActorId }) {
  if (!targetActorId) {
    return { data: [], error: null };
  }

  const cached = fuelPriceCache.get(targetActorId);
  if (cached) return { data: cached, error: null };

  const result = await supabase
    .schema("vc")
    .from("vport_fuel_prices")
    .select(
      "target_actor_id,fuel_key,price,currency_code,unit,is_available,updated_at,updated_by_actor_id,source"
    )
    .eq("target_actor_id", targetActorId)
    .order("fuel_key", { ascending: true });

  if (!result.error && result.data) {
    fuelPriceCache.set(targetActorId, result.data);
  }

  return result;
}

export function invalidateFuelPriceCache(actorId) {
  fuelPriceCache.invalidate(actorId);
}
