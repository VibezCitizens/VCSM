import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";
import { normalizeFuelUnitForDb } from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasPrices.model";

const FUEL_PRICES_SELECT =
  "profile_id,fuel_key,price,currency_code,unit,is_available,updated_at,updated_by_actor_id,source";

/**
 * Unit toggle helper — called from gas unit toggle, not from submitFuelPriceSuggestion.
 * Resolves profileId internally because it is called directly with actorId.
 */
export async function updateFuelPriceUnitForActorDAL({ actorId, unit }) {
  if (!actorId) throw new Error("actorId required");
  if (!unit) throw new Error("unit required");

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) return { error: new Error("profile not found for actor") };

  // TICKET-FUEL-UNIT-001: normalize the display unit ('gallon') to the DB value
  // ('gal') immediately before persistence. fuel_prices.unit CHECK = gal|liter|kwh.
  return vportSchema
    .from("fuel_prices")
    .update({ unit: normalizeFuelUnitForDb(unit), updated_at: new Date().toISOString() })
    .eq("profile_id", profileId);
}

/**
 * Upsert the official fuel price for a given VPORT actor.
 *
 * Actor-first: resolves profileId internally from targetActorId.
 * Callers never supply profileId — only the actor identity.
 *
 * @param {{ targetActorId: string, fuelKey: string, price: number, ... }} opts
 */
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

  const profileId = await resolveVportProfileId(targetActorId);
  if (!profileId) return { data: null, error: new Error("profile not found for actor") };

  // TICKET-FUEL-UNIT-001: normalize the display unit ('gallon') to the DB value
  // ('gal') immediately before persistence. fuel_prices.unit CHECK = gal|liter|kwh.
  return vportSchema
    .from("fuel_prices")
    .upsert(
      [
        {
          profile_id: profileId,
          fuel_key: fuelKey,
          price,
          currency_code: currencyCode,
          unit: normalizeFuelUnitForDb(unit),
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
