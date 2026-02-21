// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\gas\vportFuelPriceSubmissions.write.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Create a fuel price submission (citizen suggestion)
 * DAL — RAW DB ROW (insert result)
 *
 * actor-first:
 * - targetActorId = vport actor
 * - submittedByActorId = actor submitting suggestion
 */
export async function createFuelPriceSubmissionDAL({
  targetActorId,
  fuelKey,
  proposedPrice,
  currencyCode = "USD",
  unit = "liter",
  submittedByActorId,
  evidence = {},
}) {
  if (!targetActorId) throw new Error("targetActorId required");
  if (!fuelKey) throw new Error("fuelKey required");
  if (proposedPrice == null) throw new Error("proposedPrice required");

  return supabase
    .schema("vc")
    .from("vport_fuel_price_submissions")
    .insert([
      {
        target_actor_id: targetActorId,
        fuel_key: fuelKey,
        proposed_price: proposedPrice,
        currency_code: currencyCode,
        unit,
        submitted_by_actor_id: submittedByActorId,
        evidence,
        status: "pending",
      },
    ])
    .select(
      "id,target_actor_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,reviewed_at,reviewed_by_actor_id,decision_reason,evidence"
    )
    .maybeSingle();
}