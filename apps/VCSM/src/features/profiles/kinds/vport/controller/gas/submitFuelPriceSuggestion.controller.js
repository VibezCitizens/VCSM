// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\controller\gas\submitFuelPriceSuggestion.controller.js

import { fetchVportFuelPricesDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPrices.read.dal";
import { fetchVportStationPriceSettingsDAL } from "@/features/profiles/kinds/vport/dal/gas/vportStationPriceSettings.read.dal";
import { createFuelPriceSubmissionDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.write.dal";

import { upsertVportFuelPriceDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPrices.write.dal";

import { mapVportFuelPriceRows } from "@/features/profiles/kinds/vport/model/gas/vportFuelPrice.model";
import { mapFuelPriceSubmissionRow } from "@/features/profiles/kinds/vport/model/gas/vportFuelPriceSubmission.model";
import { mapVportStationPriceSettingsRow } from "@/features/profiles/kinds/vport/model/gas/vportStationPriceSettings.model";

/**
 * Citizen submits a price suggestion.
 * Controller — owns sanity checks + meaning.
 */
export async function submitFuelPriceSuggestionController({
  targetActorId,
  fuelKey,
  proposedPrice,
  actorId,
  currencyCode = "USD",
  unit = "liter",
  evidence = {},

  // ✅ NEW: when true, bypass suggestion pipeline and upsert official directly
  ownerUpdate = false,

  // ✅ optional: allow owner to toggle availability using same payload shape
  isAvailable = true,

  // ✅ optional: owner source tag
  source = "manual",
}) {
  if (!targetActorId) throw new Error("targetActorId required");
  if (!fuelKey) throw new Error("fuelKey required");
  if (proposedPrice == null) throw new Error("proposedPrice required");
  if (!actorId) throw new Error("actorId required");

  // settings (actor-first)
  const { data: settingsRow, error: settingsErr } =
    await fetchVportStationPriceSettingsDAL({ targetActorId });
  if (settingsErr) throw settingsErr;

  const settings = mapVportStationPriceSettingsRow(settingsRow);
  const p = Number(proposedPrice);

  if (!Number.isFinite(p)) {
    return { ok: false, reason: "invalid_number" };
  }

  // ✅ Owner path: do NOT create a submission, do NOT go through approval
  if (ownerUpdate) {
    // IMPORTANT: server-side/DB security should also enforce this (RLS/permissions).
    // This is the minimum hard guard you can do here with what you have:
    if (String(actorId) !== String(targetActorId)) {
      return { ok: false, reason: "not_owner" };
    }

    // Optionally keep sanity checks for owner too (your call).
    // If you want owner to bypass sanity checks entirely, remove this block.
    if (settings.requireSanityForSuggestion) {
      if (p < settings.minPrice || p > settings.maxPrice) {
        return { ok: false, reason: "out_of_range" };
      }
    }

    const { data: row, error } = await upsertVportFuelPriceDAL({
      targetActorId,
      fuelKey,
      price: p,
      currencyCode,
      unit,
      updatedByActorId: actorId,
      source,
      isAvailable,
    });

    if (error) throw error;

    return { ok: true, official: row };
  }

  // ✅ Citizen path: keep approval pipeline exactly as-is
  if (settings.requireSanityForSuggestion) {
    if (p < settings.minPrice || p > settings.maxPrice) {
      return { ok: false, reason: "out_of_range" };
    }

    // compare to official for this fuelKey (actor-first)
    const { data: officialRows, error: officialErr } =
      await fetchVportFuelPricesDAL({ targetActorId });
    if (officialErr) throw officialErr;

    const official = mapVportFuelPriceRows(officialRows);
    const officialRow = official.find((x) => x.fuelKey === fuelKey);

    if (officialRow?.price != null) {
      const absDelta = Math.abs(p - officialRow.price);
      const pctDelta = officialRow.price > 0 ? absDelta / officialRow.price : 0;

      if (absDelta > settings.maxDeltaAbs || pctDelta > settings.maxDeltaPct) {
        return { ok: false, reason: "too_far_from_official" };
      }
    }
  }

  // create submission (actor-first)
  const { data: row, error } = await createFuelPriceSubmissionDAL({
    targetActorId,
    fuelKey,
    proposedPrice: p,
    currencyCode,
    unit,
    submittedByActorId: actorId,
    evidence,
  });

  if (error) throw error;

  return { ok: true, submission: mapFuelPriceSubmissionRow(row) };
}