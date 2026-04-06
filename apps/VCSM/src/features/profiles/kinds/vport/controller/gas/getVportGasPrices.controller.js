// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\controller\gas\getVportGasPrices.controller.js

import { fetchVportFuelPricesDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPrices.read.dal";
import { fetchPendingFuelPriceSubmissionsDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.read.dal";
import { fetchVportStationPriceSettingsDAL } from "@/features/profiles/kinds/vport/dal/gas/vportStationPriceSettings.read.dal";

import { mapVportFuelPriceRows } from "@/features/profiles/kinds/vport/model/gas/vportFuelPrice.model";
import { mapFuelPriceSubmissionRows } from "@/features/profiles/kinds/vport/model/gas/vportFuelPriceSubmission.model";
import { mapVportStationPriceSettingsRow } from "@/features/profiles/kinds/vport/model/gas/vportStationPriceSettings.model";

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

  // 1️⃣ Station settings (actor-first)
  const { data: settingsRow, error: settingsErr } =
    await fetchVportStationPriceSettingsDAL({
      targetActorId: actorId,
    });

  if (settingsErr) throw settingsErr;

  const settings = mapVportStationPriceSettingsRow(settingsRow);

  // 2️⃣ Official prices
  const { data: officialRows, error: officialErr } =
    await fetchVportFuelPricesDAL({
      targetActorId: actorId,
    });

  if (officialErr) throw officialErr;

  const official = mapVportFuelPriceRows(officialRows);

  // 3️⃣ Community suggestions (pending only)
  let pending = [];

  if (settings.showCommunitySuggestion) {
    const { data: pendingRows, error: pendingErr } =
      await fetchPendingFuelPriceSubmissionsDAL({
        targetActorId: actorId,
        fuelKey,
        limit: 50,
      });

    if (pendingErr) throw pendingErr;

    pending = mapFuelPriceSubmissionRows(pendingRows);
  }

  /**
   * Domain meaning:
   * Only the latest pending submission per fuelKey matters
   */
  const latestPendingByFuelKey = pending.reduce((acc, submission) => {
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
  }, {});

  return {
    actorId,
    settings,
    official,
    communitySuggestionByFuelKey: latestPendingByFuelKey,
  };
}