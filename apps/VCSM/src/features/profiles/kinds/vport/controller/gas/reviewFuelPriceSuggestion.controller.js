// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\controller\gas\reviewFuelPriceSuggestion.controller.js

import { fetchFuelPriceSubmissionByIdDAL, invalidatePendingSubmissionsCache } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.read.dal";
import {
  createFuelPriceSubmissionReviewDAL,
  updateFuelPriceSubmissionStatusDAL,
} from "@/features/profiles/kinds/vport/dal/gas/vportFuelPriceReviews.write.dal";
import { upsertVportFuelPriceDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPrices.write.dal";
import { resolveActorIdFromProfileId } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPrices.read.dal";
import { checkVportOwnershipController } from "@/features/profiles/adapters/kinds/vport/ownership.adapter";
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

  // ✅ SECURITY: resolve station owner before any write.
  // submissions carry profile_id — resolve the VPORT actor_id first,
  // then verify the caller actually owns that station via actor_owners.
  const targetActorId = await resolveActorIdFromProfileId(subRow.profile_id);
  if (!targetActorId) throw new Error("could not resolve actor_id from submission profile_id");

  const isOwner = await checkVportOwnershipController({
    callerActorId: decidedByActorId,
    targetActorId,
  });
  if (!isOwner) return { ok: false, reason: "not_owner" };

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

  // Submission status changed — pending list is stale for this station.
  invalidatePendingSubmissionsCache(targetActorId);

  let official = null;
  let appliedToOfficial = false;

  // ✅ this is the ONLY thing that writes "official prices"
  // targetActorId was already resolved and ownership verified above.
  if (decision === "approved" && applyToOfficialOnApprove) {
    const { data: officialRow, error: officialErr } =
      await upsertVportFuelPriceDAL({
        targetActorId,
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
      targetActorId,
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