import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";
import { invalidatePendingSubmissionsCache } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal";

const SUBMISSION_SELECT =
  "id,profile_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,reviewed_at,reviewed_by_actor_id,decision_reason";

/**
 * Insert a citizen fuel-price submission for a given VPORT actor.
 *
 * Actor-first: resolves profileId internally from targetActorId.
 * Callers never supply profileId — only the actor identity.
 * targetActorId is used both for profile resolution and for invalidating
 * the actor-keyed pending-submissions read cache after insert.
 *
 * @param {{ targetActorId: string, fuelKey: string, ... }} opts
 */
export async function createFuelPriceSubmissionDAL({
  targetActorId,
  fuelKey,
  proposedPrice,
  currencyCode = "USD",
  unit = "liter",
  submittedByActorId,
}) {
  if (!targetActorId) throw new Error("targetActorId required");
  if (!fuelKey) throw new Error("fuelKey required");
  if (proposedPrice == null) throw new Error("proposedPrice required");

  const profileId = await resolveVportProfileId(targetActorId);
  if (!profileId) return { data: null, error: new Error("profile not found for actor") };

  const result = await vportSchema
    .from("fuel_price_submissions")
    .insert([
      {
        profile_id: profileId,
        fuel_key: fuelKey,
        proposed_price: proposedPrice,
        currency_code: currencyCode,
        unit,
        submitted_by_actor_id: submittedByActorId,
        status: "pending",
      },
    ])
    .select(SUBMISSION_SELECT)
    .maybeSingle();

  // New submission added — pending list is stale for this station.
  // Use targetActorId (actor-keyed cache) to invalidate correctly.
  if (!result.error && targetActorId) {
    invalidatePendingSubmissionsCache(targetActorId);
  }

  return result;
}
