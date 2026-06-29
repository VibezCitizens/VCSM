import { fetchVportFuelPricesDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal";
import { fetchPendingFuelPriceSubmissionsDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal";
import { fetchVportStationPriceSettingsDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal";
import { mapVportFuelPriceRows } from "@/features/vportDashboard/dashboard/cards/gasprices/model/vportFuelPrice.model";
import { mapFuelPriceSubmissionRows } from "@/features/vportDashboard/dashboard/cards/gasprices/model/vportFuelPriceSubmission.model";
import { mapVportStationPriceSettingsRow } from "@/features/vportDashboard/dashboard/cards/gasprices/model/vportStationPriceSettings.model";
import {
  groupSubmissionsIntoBatches,
  attachSubmittersToBatches,
} from "@/features/vportDashboard/dashboard/cards/gasprices/model/fuelPriceBatch.model";
import { fetchSubmitterSummariesDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmitters.read.dal";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

export async function getVportGasPricesController({ actorId, fuelKey = null }) {
  try {
    if (!actorId) throw new Error("actorId required");

    const [
      { data: settingsRow, error: settingsErr },
      { data: officialRows, error: officialErr },
      { data: pendingRows, error: pendingErr },
    ] = await Promise.all([
      fetchVportStationPriceSettingsDAL({ targetActorId: actorId }),
      fetchVportFuelPricesDAL({ targetActorId: actorId }),
      fetchPendingFuelPriceSubmissionsDAL({ targetActorId: actorId, fuelKey, limit: 50 }),
    ]);

    if (settingsErr) throw settingsErr;
    if (officialErr) throw officialErr;
    if (pendingErr) throw pendingErr;

    const settings = mapVportStationPriceSettingsRow(settingsRow);
    const official = mapVportFuelPriceRows(officialRows);
    const pending  = mapFuelPriceSubmissionRows(pendingRows);

    const latestPendingByFuelKey = settings.showCommunitySuggestion
      ? pending.reduce((acc, submission) => {
          const key = submission.fuelKey;
          if (!acc[key]) {
            acc[key] = submission;
            return acc;
          }
          if (new Date(submission.submittedAt).getTime() > new Date(acc[key].submittedAt).getTime()) {
            acc[key] = submission;
          }
          return acc;
        }, {})
      : {};

    // V03C-L1 (TICKET-GASPRICES-PENDINGREAD-GATE-001): the pending review queue and
    // submitter display identity are owner-only moderation state. Gate them on
    // session ownership of the (always-vport) station actor — the same vport-only
    // session-derived helper already used by the gas write controllers
    // (submitOwnerFuelPriceUpdate / updateStationFuelUnit). The catch is scoped to
    // the ownership assertion ONLY: ownership denial degrades to the public branch
    // (no throw) so settings + official prices + community suggestion still return;
    // any real DAL failure in the owner branch below still propagates as before.
    let isOwner = false;
    try {
      await assertSessionOwnsActorController({ targetActorId: actorId });
      isOwner = true;
    } catch {
      isOwner = false;
    }

    let pendingSubmissions = [];
    let pendingBatches = [];

    if (isOwner) {
      // Group pending submissions into one card per citizen submission batch, then
      // hydrate the submitting citizen's display identity (actorId-keyed only).
      const groupedBatches = groupSubmissionsIntoBatches(pending);
      const submitterIds = groupedBatches
        .map((b) => b.submittedByActorId)
        .filter(Boolean);
      const submitterSummaries = await fetchSubmitterSummariesDAL({ actorIds: submitterIds });
      pendingSubmissions = pending;
      pendingBatches = attachSubmittersToBatches(groupedBatches, submitterSummaries);
    }

    return {
      actorId,
      settings,
      official,
      communitySuggestionByFuelKey: latestPendingByFuelKey,
      pendingSubmissions,
      pendingBatches,
    };
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'gasprices.getVportGasPrices.controller', severity: 'error', message: `getVportGasPricesController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'getVportGasPrices', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
