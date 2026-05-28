import { fetchVportFuelPricesDAL } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal";
import { fetchPendingFuelPriceSubmissionsDAL } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal";
import { fetchVportStationPriceSettingsDAL } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal";

import { mapVportFuelPriceRows } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/vportFuelPrice.model";
import { mapFuelPriceSubmissionRows } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/vportFuelPriceSubmission.model";
import { mapVportStationPriceSettingsRow } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/vportStationPriceSettings.model";

/**
 * Controller — Gas Prices View
 *
 * Responsibilities:
 * - Orchestrate DAL calls
 * - Apply domain meaning (latest submission per fuel)
 * - Return domain-safe objects only
 *
 * No UI logic.
 */
export async function getVportGasPricesController({
  actorId,
  fuelKey = null,
}) {
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

  const pending = mapFuelPriceSubmissionRows(pendingRows);

  // Community display: only the latest per fuel when station has opted in.
  // Owner review panel: always receives the full list via pendingSubmissions.
  const latestPendingByFuelKey = settings.showCommunitySuggestion
    ? pending.reduce((acc, submission) => {
        const key = submission.fuelKey;

        if (!acc[key]) {
          acc[key] = submission;
          return acc;
        }

        if (
          new Date(submission.submittedAt).getTime() >
          new Date(acc[key].submittedAt).getTime()
        ) {
          acc[key] = submission;
        }

        return acc;
      }, {})
    : {};

  return {
    actorId,
    settings,
    official,
    communitySuggestionByFuelKey: latestPendingByFuelKey,
    pendingSubmissions: pending,
  };
}
