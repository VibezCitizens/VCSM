import vportSchema from "@/services/supabase/vportClient";
import { invalidatePendingSubmissionsCache } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.read.dal";
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";

const SUBMISSION_SELECT =
  "id,profile_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,reviewed_at,reviewed_by_actor_id,decision_reason,evidence";

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
        evidence,
        status: "pending",
      },
    ])
    .select(SUBMISSION_SELECT)
    .maybeSingle();

  // New submission added — pending list is stale for this station.
  if (!result.error) {
    invalidatePendingSubmissionsCache(targetActorId);
  }

  return result;
}
