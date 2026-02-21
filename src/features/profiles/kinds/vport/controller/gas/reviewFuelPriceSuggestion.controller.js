// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\controller\gas\reviewFuelPriceSuggestion.controller.js

import { fetchFuelPriceSubmissionByIdDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.read.dal";
import {
  createFuelPriceSubmissionReviewDAL,
  updateFuelPriceSubmissionStatusDAL,
} from "@/features/profiles/kinds/vport/dal/gas/vportFuelPriceReviews.write.dal";
import { upsertVportFuelPriceDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPrices.write.dal";
import { createVportFuelPriceHistoryDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPriceHistory.write.dal";

import { mapFuelPriceSubmissionRow } from "@/features/profiles/kinds/vport/model/gas/vportFuelPriceSubmission.model";
import { mapVportFuelPriceRow } from "@/features/profiles/kinds/vport/model/gas/vportFuelPrice.model";

/**
 * Owner/admin reviews a pending submission.
 * Approve => (optional) updates official + adds history
 */
export async function reviewFuelPriceSuggestionController({
  submissionId,
  decision, // 'approved' | 'rejected'
  decidedByActorId,
  reason = null,
  applyToOfficialOnApprove = true,
}) {
  if (!submissionId) throw new Error("submissionId required");
  if (!decision) throw new Error("decision required");
  if (!decidedByActorId) throw new Error("decidedByActorId required");

  const { data: subRow, error: subErr } =
    await fetchFuelPriceSubmissionByIdDAL({ submissionId });

  if (subErr) throw subErr;
  if (!subRow) throw new Error("submission not found");

  if (subRow.status !== "pending") {
    return {
      ok: false,
      reason: "not_pending",
      submission: mapFuelPriceSubmissionRow(subRow),
    };
  }

  // Update submission status
  const { data: updatedSubRow, error: updErr } =
    await updateFuelPriceSubmissionStatusDAL({
      submissionId,
      status: decision,
      reviewedAt: new Date().toISOString(),
      reviewedByActorId: decidedByActorId,
      decisionReason: reason,
    });

  if (updErr) throw updErr;

  let official = null;
  let appliedToOfficial = false;

  // ✅ this is the ONLY thing that writes "official prices"
  if (decision === "approved" && applyToOfficialOnApprove) {
    const { data: officialRow, error: officialErr } =
      await upsertVportFuelPriceDAL({
        targetActorId: updatedSubRow.target_actor_id,
        fuelKey: updatedSubRow.fuel_key,
        price: updatedSubRow.proposed_price,
        currencyCode: updatedSubRow.currency_code,
        unit: updatedSubRow.unit,
        updatedByActorId: decidedByActorId,
        source: "manual",
        isAvailable: true,
      });

    if (officialErr) throw officialErr;

    official = mapVportFuelPriceRow(officialRow);

    const { error: histErr } = await createVportFuelPriceHistoryDAL({
      targetActorId: updatedSubRow.target_actor_id,
      fuelKey: updatedSubRow.fuel_key,
      price: updatedSubRow.proposed_price,
      currencyCode: updatedSubRow.currency_code,
      unit: updatedSubRow.unit,
      actorId: decidedByActorId,
      source: "manual",
      isAvailable: true,
    });

    if (histErr) throw histErr;

    appliedToOfficial = true;
  }

  // ✅ review row is just a log; store the boolean here at insert-time
  const { data: reviewRow, error: reviewErr } =
    await createFuelPriceSubmissionReviewDAL({
      submissionId,
      decision,
      decidedByActorId,
      reason,
      appliedToOfficial,
    });

  if (reviewErr) throw reviewErr;

  return {
    ok: true,
    submission: mapFuelPriceSubmissionRow(updatedSubRow),
    review: reviewRow,
    official,
  };
}