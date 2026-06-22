import vportSchema from "@/services/supabase/vportClient";
import { createTTLCache } from "@/shared/lib/ttlCache";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";

const ratesCache = createTTLCache(60_000);

const RATES_SELECT = "id,profile_id,rate_type,base_currency,quote_currency,buy_rate,sell_rate,meta,updated_at,created_at";

export default async function readVportRatesByActorDal({
  actorId,
  rateType = "fx",
} = {}) {
  if (!actorId) throw new Error("readVportRatesByActorDal: actorId is required");

  const cacheKey = `${actorId}:${rateType}`;
  const cached = ratesCache.get(cacheKey);
  if (cached) return cached;

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) return [];

  const { data, error } = await vportSchema
    .from("rates")
    .select(RATES_SELECT)
    .eq("profile_id", profileId)
    .eq("rate_type", rateType)
    .order("base_currency", { ascending: true })
    .order("quote_currency", { ascending: true });

  if (error) throw error;
  const result = Array.isArray(data) ? data : [];
  ratesCache.set(cacheKey, result);
  return result;
}

export function invalidateRatesCache() {
  ratesCache.invalidateAll();
}
