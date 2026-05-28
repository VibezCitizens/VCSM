import { fetchVportFuelPricesDAL, invalidateFuelPriceCache } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal";
import { fetchVportStationPriceSettingsDAL } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal";
import { createFuelPriceSubmissionDAL } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.write.dal";
import { fetchPendingFuelPriceSubmissionsDAL } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal";

import { upsertVportFuelPriceDAL } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal";
import { createVportFuelPriceHistoryDAL } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPriceHistory.write.dal";

import { mapVportFuelPriceRow, mapVportFuelPriceRows } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/vportFuelPrice.model";
import { mapFuelPriceSubmissionRow } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/vportFuelPriceSubmission.model";
import { mapVportStationPriceSettingsRow } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/vportStationPriceSettings.model";
import { checkVportOwnershipController } from "@/features/profiles/adapters/kinds/vport/ownership.adapter";

// ✅ Controller-level resolution: the controller owns the profileId lookup so
// write DALs receive a pre-verified profileId and do not re-resolve.
// Do NOT import this in hooks or screens — only controllers may call it.
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";
import { ALLOWED_FUEL_KEYS } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/gasPrices.model";

/**
 * Citizen submits a price suggestion.
 * Controller — owns sanity checks + meaning.
 *
 * Contract:
 *   - UI/hook passes targetActorId only. Never trust client-supplied profileId.
 *   - Controller resolves profileId server-side from targetActorId.
 *   - Write DALs receive profileId directly (profile-scoped tables need profileId, not actorId).
 *   - Ownership gate is always verified server-side via actor_owners before any write.
 */
export async function submitFuelPriceSuggestionController({
  targetActorId,
  fuelKey,
  proposedPrice,
  actorId,
  currencyCode = "USD",
  unit = "liter",

  // ✅ when true, bypass suggestion pipeline and upsert official directly
  ownerUpdate = false,

  // ✅ optional: allow owner to toggle availability using same payload shape
  isAvailable = true,

  // ✅ optional: owner source tag
  source = "manual",
}) {
  if (!targetActorId) throw new Error("targetActorId required");
  if (!fuelKey) throw new Error("fuelKey required");
  if (!ALLOWED_FUEL_KEYS.has(String(fuelKey).toLowerCase())) {
    return { ok: false, reason: "invalid_fuel_key" };
  }
  if (proposedPrice == null) throw new Error("proposedPrice required");
  if (!actorId) throw new Error("actorId required");

  // ─── Profile resolution ────────────────────────────────────────────────────
  // Resolve the vport.profiles.id server-side from targetActorId.
  // This is the single resolution point — write DALs receive profileId directly.
  // We never trust any client-supplied profileId; the only input from the caller
  // is targetActorId (the actor who owns the gas station).
  //
  // Return a typed soft-error instead of throwing so the UI can surface a
  // meaningful message ("Station not set up yet") rather than a crash.
  const profileId = await resolveVportProfileId(targetActorId);
  if (!profileId) return { ok: false, reason: "profile_not_found" };

  // settings (actor-first — settings DAL resolves profileId internally via cache)
  const { data: settingsRow, error: settingsErr } =
    await fetchVportStationPriceSettingsDAL({ targetActorId });
  if (settingsErr) throw settingsErr;

  const settings = mapVportStationPriceSettingsRow(settingsRow);
  const p = Number(proposedPrice);

  if (!Number.isFinite(p)) {
    return { ok: false, reason: "invalid_number" };
  }

  // ─── Owner path ───────────────────────────────────────────────────────────
  // Do NOT create a submission — write to official price directly.
  if (ownerUpdate) {
    // ✅ SECURITY: verify ownership via actor_owners — not string comparison.
    // Handles acting-as VPORT mode and future multi-owner / delegated access.
    const isOwner = await checkVportOwnershipController({ callerActorId: actorId, targetActorId });
    if (!isOwner) return { ok: false, reason: "not_owner" };

    // Optionally keep sanity checks for owner too (your call).
    if (settings.requireSanityForSuggestion) {
      if (p < settings.minPrice || p > settings.maxPrice) {
        return { ok: false, reason: "out_of_range" };
      }
    }

    // DALs are actor-first — they resolve profileId internally.
    // The controller already verified profileId exists above (profile_not_found guard).
    // The 30s TTL cache means DAL resolution is a cache hit — no extra DB round-trip.
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

    const { error: histErr } = await createVportFuelPriceHistoryDAL({
      targetActorId,
      fuelKey,
      price: p,
      currencyCode,
      unit,
      actorId,
      source,
      isAvailable,
    });
    if (histErr) throw histErr;

    // Invalidate read cache so the next refresh fetches fresh data from DB
    invalidateFuelPriceCache(targetActorId);

    return { ok: true, official: mapVportFuelPriceRow(row) };
  }

  // ─── Citizen path ─────────────────────────────────────────────────────────
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

  // ─── Existing-pending guard ───────────────────────────────────────────────
  // App-level check before INSERT so the caller gets a clear "already_pending"
  // signal even before the DB partial UNIQUE constraint fires (CARNAGE sprint).
  const { data: existingPending, error: existingErr } =
    await fetchPendingFuelPriceSubmissionsDAL({ targetActorId, fuelKey });
  if (existingErr) throw existingErr;
  if (existingPending?.some((s) => s.submitted_by_actor_id === actorId)) {
    return { ok: false, reason: "already_pending" };
  }

  // DAL is actor-first — resolves profileId internally and handles cache invalidation.
  const { data: row, error } = await createFuelPriceSubmissionDAL({
    targetActorId,
    fuelKey,
    proposedPrice: p,
    currencyCode,
    unit,
    submittedByActorId: actorId,
  });

  if (error?.code === "23505") {
    return { ok: false, reason: "already_pending" };
  }
  if (error) throw error;

  return { ok: true, submission: mapFuelPriceSubmissionRow(row) };
}
