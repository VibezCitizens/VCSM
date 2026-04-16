import vportSchema from "@/services/supabase/vportClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

const fuelPriceCache = createTTLCache(60_000);

const FUEL_PRICES_SELECT =
  "profile_id,fuel_key,price,currency_code,unit,is_available,updated_at,updated_by_actor_id,source";

async function resolveProfileId(actorId) {
  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function fetchVportFuelPricesDAL({ targetActorId }) {
  if (!targetActorId) return { data: [], error: null };

  const cached = fuelPriceCache.get(targetActorId);
  if (cached) return { data: cached, error: null };

  const profileId = await resolveProfileId(targetActorId);
  if (!profileId) return { data: [], error: null };

  const result = await vportSchema
    .from("fuel_prices")
    .select(FUEL_PRICES_SELECT)
    .eq("profile_id", profileId)
    .order("fuel_key", { ascending: true });

  if (!result.error && result.data) {
    fuelPriceCache.set(targetActorId, result.data);
  }

  return result;
}

export function invalidateFuelPriceCache(actorId) {
  fuelPriceCache.invalidate(actorId);
}
