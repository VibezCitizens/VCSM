import { fetchVportFuelPricesDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal";
import { fetchVportStationPriceSettingsDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal";
import { createFuelPriceSubmissionDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.write.dal";
import { fetchPendingFuelPriceSubmissionsDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal";
import { mapVportFuelPriceRows } from "@/features/vportDashboard/dashboard/cards/gasprices/model/vportFuelPrice.model";
import { mapFuelPriceSubmissionRow } from "@/features/vportDashboard/dashboard/cards/gasprices/model/vportFuelPriceSubmission.model";
import { mapVportStationPriceSettingsRow } from "@/features/vportDashboard/dashboard/cards/gasprices/model/vportStationPriceSettings.model";
import { FuelPriceCacheService } from "@/features/vportDashboard/dashboard/cards/gasprices/services/fuelPriceCache.service";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

export async function submitCitizenFuelPriceSuggestionController({
  targetActorId,
  actorId,
  fuelKey,
  proposedPrice,
  currencyCode = "USD",
  unit = "liter",
  submissionBatchId = null,
  notify = true,
}) {
  try {
    const { data: settingsRow, error: settingsErr } =
      await fetchVportStationPriceSettingsDAL({ targetActorId });
    if (settingsErr) throw settingsErr;

    const settings = mapVportStationPriceSettingsRow(settingsRow);
    const price = Number(proposedPrice);
    if (!Number.isFinite(price)) return { ok: false, reason: "invalid_number" };

    if (settings.requireSanityForSuggestion) {
      if (price < settings.minPrice || price > settings.maxPrice) {
        return { ok: false, reason: "out_of_range" };
      }

      const { data: officialRows, error: officialErr } =
        await fetchVportFuelPricesDAL({ targetActorId });
      if (officialErr) throw officialErr;

      const official = mapVportFuelPriceRows(officialRows);
      const officialRow = official.find((row) => row.fuelKey === fuelKey);

      if (officialRow?.price != null) {
        const absDelta = Math.abs(price - officialRow.price);
        const pctDelta = officialRow.price > 0 ? absDelta / officialRow.price : 0;

        if (absDelta > settings.maxDeltaAbs || pctDelta > settings.maxDeltaPct) {
          return { ok: false, reason: "too_far_from_official" };
        }
      }
    }

    const { data: existingPending, error: existingErr } =
      await fetchPendingFuelPriceSubmissionsDAL({ targetActorId, fuelKey });
    if (existingErr) throw existingErr;
    if (existingPending?.some((submission) => submission.submitted_by_actor_id === actorId)) {
      return { ok: false, reason: "already_pending" };
    }

    const { data: row, error } = await createFuelPriceSubmissionDAL({
      targetActorId,
      fuelKey,
      proposedPrice: price,
      currencyCode,
      unit,
      submittedByActorId: actorId,
      submissionBatchId,
    });

    if (error?.code === "23505") return { ok: false, reason: "already_pending" };
    if (error) throw error;

    FuelPriceCacheService.invalidatePendingSubmissions(targetActorId);

    // Notify the gas station VPORT that a community price suggestion is pending review.
    // Recipient is the target VPORT actor (the station); source is the submitting citizen.
    // This path only handles citizen suggestions — owner direct price updates go through
    // submitOwnerFuelPriceUpdateController and never reach here, so owner self-updates
    // produce no notification. The publisher self-skips when source === recipient.
    // linkPath is null to avoid storing a raw actor UUID in the notification row
    // (consistent with the booking owner-notify pattern). The notification engine owns
    // its own unread-count cache invalidation after publish.
    //
    // TICKET-FUEL-BATCH-NOTIF-001: when this submit is part of a multi-fuel batch,
    // the orchestrator (useSubmitBulkFuelPrices) passes notify=false and emits ONE
    // grouped notification for the whole batch instead. notify defaults to true so
    // any standalone single-fuel caller still gets a per-fuel notification.
    if (notify) {
      publishVcsmNotification({
        recipientActorId: targetActorId,
        actorId,
        kind: "vport.gas_price_suggestion",
        objectType: "gas_price_suggestion",
        objectId: row?.id ?? null,
        linkPath: null,
        context: {
          kind: "fuel_price_submission",
          fuelKey: fuelKey ?? null,
          proposedPrice: price ?? null,
          currencyCode,
          unit,
          // Batch id only — no raw actor/profile UUID is stored. The dashboard
          // path is derived client-side from the recipient's active identity
          // (the station VPORT actor) so no raw actor UUID lands in the DB row.
          submissionBatchId: submissionBatchId ?? null,
        },
      });
    }

    return { ok: true, submission: mapFuelPriceSubmissionRow(row) };
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'gasprices.submitCitizenFuelPriceSuggestion.controller', severity: 'error', message: `submitCitizenFuelPriceSuggestionController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'submitCitizenFuelPriceSuggestion', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
