import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";
import { normalizeFuelUnitForDb } from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasPrices.model";

const HISTORY_SELECT =
  "id,profile_id,fuel_key,price,currency_code,unit,is_available,created_at,actor_id,source";

/**
 * Insert a fuel price history row for a given VPORT actor.
 *
 * Actor-first: resolves profileId internally from targetActorId.
 * Callers never supply profileId — only the actor identity.
 *
 * @param {{ targetActorId: string, fuelKey: string, price: number, ... }} opts
 */
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

  const profileId = await resolveVportProfileId(targetActorId);
  if (!profileId) return { data: null, error: new Error("profile not found for actor") };

  // TICKET-FUEL-UNIT-001: canonical normalization at the DB write boundary.
  // DB CHECK accepts gal|liter|kwh; the UI may pass 'gallon'.
  const historyUnit = normalizeFuelUnitForDb(unit);

  return vportSchema
    .from("fuel_price_history")
    .insert([
      {
        profile_id: profileId,
        fuel_key: fuelKey,
        price,
        currency_code: currencyCode,
        unit: historyUnit,
        is_available: isAvailable,
        actor_id: actorId,
        source,
      },
    ])
    .select(HISTORY_SELECT)
    .maybeSingle();
}
