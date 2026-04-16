import vportSchema from "@/services/supabase/vportClient";

const REVIEW_SELECT =
  "id,submission_id,decision,reason,decided_at,decided_by_actor_id,applied_to_official";

const SUBMISSION_SELECT =
  "id,profile_id,fuel_key,proposed_price,currency_code,unit,submitted_by_actor_id,submitted_at,status,reviewed_at,reviewed_by_actor_id,decision_reason,evidence";

export async function createFuelPriceSubmissionReviewDAL({
  submissionId,
  decision,
  decidedByActorId,
  reason = null,
  appliedToOfficial = false,
}) {
  if (!submissionId) throw new Error("submissionId required");
  if (!decision) throw new Error("decision required");

  return vportSchema
    .from("fuel_price_submission_reviews")
    .insert([
      {
        submission_id: submissionId,
        decision,
        reason,
        decided_by_actor_id: decidedByActorId,
        applied_to_official: appliedToOfficial,
      },
    ])
    .select(REVIEW_SELECT)
    .maybeSingle();
}

export async function updateFuelPriceSubmissionStatusDAL({
  submissionId,
  status,
  reviewedAt,
  reviewedByActorId,
  decisionReason = null,
}) {
  if (!submissionId) throw new Error("submissionId required");
  if (!status) throw new Error("status required");

  return vportSchema
    .from("fuel_price_submissions")
    .update({
      status,
      reviewed_at: reviewedAt ?? new Date().toISOString(),
      reviewed_by_actor_id: reviewedByActorId ?? null,
      decision_reason: decisionReason,
    })
    .eq("id", submissionId)
    .select(SUBMISSION_SELECT)
    .maybeSingle();
}

export async function markFuelPriceSubmissionReviewAppliedDAL({
  reviewId,
  appliedToOfficial = true,
}) {
  if (!reviewId) throw new Error("reviewId required");

  return vportSchema
    .from("fuel_price_submission_reviews")
    .update({ applied_to_official: appliedToOfficial })
    .eq("id", reviewId)
    .select(REVIEW_SELECT)
    .maybeSingle();
}
