// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\dal\gas\vportFuelPriceReviews.write.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Insert review record
 * DAL — RAW DB ROW
 */
export async function createFuelPriceSubmissionReviewDAL({
  submissionId,
  decision, // 'approved' | 'rejected'
  decidedByActorId,
  reason = null,
  appliedToOfficial = false, // ✅ NEW
}) {
  if (!submissionId) throw new Error("submissionId required");
  if (!decision) throw new Error("decision required");

  return supabase
    .schema("vc")
    .from("vport_fuel_price_submission_reviews")
    .insert([
      {
        submission_id: submissionId,
        decision,
        reason,
        decided_by_actor_id: decidedByActorId,
        applied_to_official: appliedToOfficial, // ✅ use param
      },
    ])
    .select(
      "id,submission_id,decision,reason,decided_at,decided_by_actor_id,applied_to_official"
    )
    .maybeSingle();
}

/**
 * Update submission status
 * DAL — RAW DB ROW
 */
export async function updateFuelPriceSubmissionStatusDAL({
  submissionId,
  status, // 'approved' | 'rejected' | 'cancelled' | 'pending'
  reviewedAt,
  reviewedByActorId,
  decisionReason = null,
}) {
  if (!submissionId) throw new Error("submissionId required");
  if (!status) throw new Error("status required");

  return supabase
    .schema("vc")
    .from("vport_fuel_price_submissions")
    .update({
      status,
      reviewed_at: reviewedAt ?? new Date().toISOString(),
      reviewed_by_actor_id: reviewedByActorId ?? null,
      decision_reason: decisionReason,
    })
    .eq("id", submissionId)
    .select(
      "id,target_actor_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,reviewed_at,reviewed_by_actor_id,decision_reason,evidence"
    )
    .maybeSingle();
}

/**
 * Mark review row as applied_to_official
 * NOTE: remove usage. Keep temporarily if other code still calls it.
 */
export async function markFuelPriceSubmissionReviewAppliedDAL({
  reviewId,
  appliedToOfficial = true,
}) {
  if (!reviewId) throw new Error("reviewId required");

  return supabase
    .schema("vc")
    .from("vport_fuel_price_submission_reviews")
    .update({
      applied_to_official: appliedToOfficial,
    })
    .eq("id", reviewId)
    .select(
      "id,submission_id,decision,reason,decided_at,decided_by_actor_id,applied_to_official"
    )
    .maybeSingle();
}