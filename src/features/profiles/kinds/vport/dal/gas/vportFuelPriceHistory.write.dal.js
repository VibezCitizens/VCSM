// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\gas\vportFuelPriceHistory.write.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Insert history row (audit trail)
 * DAL — RAW DB ROW
 *
 * actor-first:
 * - targetActorId = vport actor whose prices are being updated
 * - actorId = actor who performed the change (audit)
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

  return supabase
    .schema("vc")
    .from("vport_fuel_price_history")
    .insert([
      {
        target_actor_id: targetActorId,
        fuel_key: fuelKey,
        price,
        currency_code: currencyCode,
        unit,
        is_available: isAvailable,
        actor_id: actorId,
        source,
      },
    ])
    .select(
      "id,target_actor_id,fuel_key,price,currency_code,unit,is_available,created_at,actor_id,source"
    )
    .maybeSingle();
}