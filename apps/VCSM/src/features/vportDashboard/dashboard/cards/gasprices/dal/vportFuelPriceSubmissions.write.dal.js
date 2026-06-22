import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";
import { normalizeFuelUnitForDb } from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasPrices.model";

const SUBMISSION_SELECT =
  "id,profile_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,reviewed_at,reviewed_by_actor_id,decision_reason,submission_batch_id";

/**
 * Insert a citizen fuel-price submission for a given VPORT actor.
 *
 * Actor-first: resolves profileId internally from targetActorId.
 * Callers never supply profileId — only the actor identity.
 * targetActorId is used for profile resolution. Cache invalidation is owned by
 * the controller/service layer after a successful write.
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
  submissionBatchId = null,
}) {
  if (!targetActorId) throw new Error("targetActorId required");
  if (!fuelKey) throw new Error("fuelKey required");
  if (proposedPrice == null) throw new Error("proposedPrice required");

  const profileId = await resolveVportProfileId(targetActorId);
  if (!profileId) return { data: null, error: new Error("profile not found for actor") };

  // TICKET-FUEL-UNIT-001: canonical normalization at the DB write boundary.
  // DB CHECK accepts gal|liter|kwh; the UI may pass 'gallon'.
  const submissionUnit = normalizeFuelUnitForDb(unit);

  // submission_batch_id groups all fuels submitted together in one citizen action.
  // The column has a gen_random_uuid() default, so we only set it when the caller
  // supplies a shared batch id (multi-fuel submit). Omitting it preserves the
  // single-row default for any legacy single-fuel caller.
  const insertRow = {
    profile_id: profileId,
    fuel_key: fuelKey,
    proposed_price: proposedPrice,
    currency_code: currencyCode,
    unit: submissionUnit,
    submitted_by_actor_id: submittedByActorId,
    status: "pending",
  };
  if (submissionBatchId) insertRow.submission_batch_id = submissionBatchId;

  const result = await vportSchema
    .from("fuel_price_submissions")
    .insert([insertRow])
    .select(SUBMISSION_SELECT)
    .maybeSingle();

  return result;
}
