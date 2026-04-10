import supabase from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

const ratesCache = createTTLCache(60_000); // 60 seconds

export default async function readVportRatesByActorDal({
  actorId,
  rateType = "fx",
} = {}) {
  if (!actorId) {
    throw new Error("readVportRatesByActorDal: actorId is required");
  }

  const cacheKey = `${actorId}:${rateType}`;
  const cached = ratesCache.get(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_rates")
    .select(
      [
        "id",
        "actor_id",
        "rate_type",
        "base_currency",
        "quote_currency",
        "buy_rate",
        "sell_rate",
        "meta",
        "updated_at",
        "created_at",
      ].join(",")
    )
    .eq("actor_id", actorId)
    .eq("rate_type", rateType)
    .order("base_currency", { ascending: true })
    .order("quote_currency", { ascending: true });

  if (error) throw error;
  const result = Array.isArray(data) ? data : [];
  ratesCache.set(cacheKey, result);
  return result;
}

export function invalidateRatesCache(actorId) {
  ratesCache.invalidateAll();
}
