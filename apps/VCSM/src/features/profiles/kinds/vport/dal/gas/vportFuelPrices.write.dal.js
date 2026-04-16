import vportSchema from "@/services/supabase/vportClient";

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

export async function upsertVportFuelPriceDAL({
  targetActorId,
  fuelKey,
  price,
  currencyCode = "USD",
  unit = "liter",
  updatedByActorId,
  source = "manual",
  isAvailable = true,
}) {
  if (!targetActorId) throw new Error("targetActorId required");
  if (!fuelKey) throw new Error("fuelKey required");

  const profileId = await resolveProfileId(targetActorId);
  if (!profileId) return { data: null, error: new Error("profile not found for actor") };

  return vportSchema
    .from("fuel_prices")
    .upsert(
      [
        {
          profile_id: profileId,
          fuel_key: fuelKey,
          price,
          currency_code: currencyCode,
          unit,
          is_available: isAvailable,
          updated_by_actor_id: updatedByActorId,
          source,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "profile_id,fuel_key" }
    )
    .select(FUEL_PRICES_SELECT)
    .maybeSingle();
}
