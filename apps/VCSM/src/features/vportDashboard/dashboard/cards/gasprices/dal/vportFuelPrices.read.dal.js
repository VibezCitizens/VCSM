import vportSchema from "@/services/supabase/vportClient";
import { createTTLCache } from "@/shared/lib/ttlCache";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";

const fuelPriceCache = createTTLCache(60_000);

const FUEL_PRICES_SELECT =
  "profile_id,fuel_key,price,currency_code,unit,is_available,updated_at,updated_by_actor_id,source";

// Exported so controllers can resolve actor_id from a profile_id
// (submission rows carry profile_id, not target_actor_id).
export async function resolveActorIdFromProfileId(profileId) {
  if (!profileId) return null;
  const { data } = await vportSchema
    .from("profiles")
    .select("actor_id")
    .eq("id", profileId)
    .maybeSingle();
  return data?.actor_id ?? null;
}

export async function fetchVportFuelPricesDAL({ targetActorId }) {
  if (!targetActorId) return { data: [], error: null };

  const cached = fuelPriceCache.get(targetActorId);
  if (cached) return { data: cached, error: null };

  const profileId = await resolveVportProfileId(targetActorId);
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
