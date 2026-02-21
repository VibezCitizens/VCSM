// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\gas\vportFuelPrices.write.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Upsert official price (owner/system)
 * DAL — RAW DB ROW
 *
 * actor-first:
 * - targetActorId = vport actor
 * - updatedByActorId = actor performing update
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

  return supabase
    .schema("vc")
    .from("vport_fuel_prices")
    .upsert(
      [
        {
          target_actor_id: targetActorId,
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
      { onConflict: "target_actor_id,fuel_key" }
    )
    .select(
      "target_actor_id,fuel_key,price,currency_code,unit,is_available,updated_at,updated_by_actor_id,source"
    )
    .maybeSingle();
}