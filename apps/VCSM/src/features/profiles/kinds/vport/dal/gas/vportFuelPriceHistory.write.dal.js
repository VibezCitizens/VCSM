import vportSchema from "@/services/supabase/vportClient";

const HISTORY_SELECT =
  "id,profile_id,fuel_key,price,currency_code,unit,is_available,created_at,actor_id,source";

async function resolveProfileId(actorId) {
  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function createVportFuelPriceHistoryDAL({
  targetActorId,
  fuelKey,
  price,
  currencyCode = "USD",
  unit = "liter",
  actorId = null,
  source = "manual",
  isAvailable = true,
}) {
  if (!targetActorId) throw new Error("targetActorId required");
  if (!fuelKey) throw new Error("fuelKey required");

  const profileId = await resolveProfileId(targetActorId);
  if (!profileId) return { data: null, error: new Error("profile not found for actor") };

  return vportSchema
    .from("fuel_price_history")
    .insert([
      {
        profile_id: profileId,
        fuel_key: fuelKey,
        price,
        currency_code: currencyCode,
        unit,
        is_available: isAvailable,
        actor_id: actorId,
        source,
      },
    ])
    .select(HISTORY_SELECT)
    .maybeSingle();
}
