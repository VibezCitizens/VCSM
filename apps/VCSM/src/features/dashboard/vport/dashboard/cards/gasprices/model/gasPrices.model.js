// Domain model utilities for the gas prices module.
// Pure functions — no side effects, no React, no DB access.

export const ALLOWED_FUEL_KEYS = new Set([
  "regular",
  "midgrade",
  "premium",
  "diesel",
  "e85",
  "kerosene",
]);

// ─── Formatters ──────────────────────────────────────────────────────────────

export function toEpochMs(ts) {
  if (!ts) return null;
  const ms = new Date(ts).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function formatLastUpdatedAt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function prettyFuelLabel(fuelKey) {
  const map = {
    regular: "Regular",
    midgrade: "Midgrade",
    premium: "Premium",
    diesel: "Diesel",
    e85: "E85",
    kerosene: "Kerosene",
  };
  return (
    map[String(fuelKey).toLowerCase()] ??
    String(fuelKey)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase())
  );
}

// ─── Domain computation ───────────────────────────────────────────────────────

/**
 * Resolves the ordered list of fuel keys to display.
 * Priority: settings config → merged from official + community data → 4 defaults.
 * Handles schema variance in settings shape across API versions.
 */
export function resolveFuelKeys({
  settings,
  official,
  officialByFuelKey,
  communitySuggestionByFuelKey,
}) {
  const fromSettings =
    settings?.fuelKeys ??
    settings?.fuel_keys ??
    settings?.fuels?.map((f) => f?.fuelKey ?? f?.fuel_key ?? f?.key ?? null) ??
    settings?.fuelTypes?.map((f) => f?.fuelKey ?? f?.fuel_key ?? f?.key ?? null) ??
    null;

  const cleanSettingsKeys = Array.isArray(fromSettings)
    ? fromSettings.map((k) => (k ? String(k) : null)).filter(Boolean)
    : [];

  if (cleanSettingsKeys.length) return cleanSettingsKeys;

  const keys = new Set(["regular", "midgrade", "premium", "diesel"]);
  for (const row of Array.isArray(official) ? official : []) {
    const k = row?.fuelKey ?? row?.fuel_key ?? row?.key ?? null;
    if (k) keys.add(String(k));
  }
  for (const k of Object.keys(officialByFuelKey || {})) keys.add(String(k));
  for (const k of Object.keys(communitySuggestionByFuelKey || {})) keys.add(String(k));
  return Array.from(keys);
}

/**
 * Builds the display row data for each fuel key.
 * Merges official prices, community suggestions, and last-update metadata
 * into a stable shape consumed by GasPricesPanel and BulkUpdateFuelPricesModal.
 */
export function buildFuelPriceRows({
  fuelKeys,
  official,
  officialByFuelKey,
  communitySuggestionByFuelKey,
}) {
  return fuelKeys.map((fuelKey) => {
    const officialRow =
      officialByFuelKey?.[fuelKey] ??
      (Array.isArray(official)
        ? official.find((r) => (r?.fuelKey ?? r?.fuel_key ?? r?.key) === fuelKey) ?? null
        : null);

    const suggestion = communitySuggestionByFuelKey?.[fuelKey] ?? null;
    const officialPrice = officialRow?.price ?? null;
    const officialCurrencyCode = officialRow?.currencyCode ?? officialRow?.currency_code ?? "USD";
    const officialUnit = officialRow?.unit ?? "liter";
    const officialUpdatedAt = officialRow?.updatedAt ?? officialRow?.updated_at ?? null;

    const suggestedPrice = suggestion?.proposedPrice ?? suggestion?.proposed_price ?? null;
    const suggestedCurrencyCode =
      suggestion?.currencyCode ?? suggestion?.currency_code ?? officialCurrencyCode;
    const suggestedUnit = suggestion?.unit ?? officialUnit;
    const suggestionSubmittedAt = suggestion?.submittedAt ?? suggestion?.submitted_at ?? null;

    const officialUpdatedMs = toEpochMs(officialUpdatedAt);
    const suggestionSubmittedMs = toEpochMs(suggestionSubmittedAt);

    let lastUpdateAt = null;
    let lastUpdateSource = "none";
    if (
      suggestionSubmittedMs !== null &&
      (officialUpdatedMs === null || suggestionSubmittedMs >= officialUpdatedMs)
    ) {
      lastUpdateAt = suggestionSubmittedAt;
      lastUpdateSource = "community";
    } else if (officialUpdatedMs !== null) {
      lastUpdateAt = officialUpdatedAt;
      lastUpdateSource = "official";
    }

    return {
      fuelKey,
      label: prettyFuelLabel(fuelKey),
      official: { price: officialPrice, currencyCode: officialCurrencyCode, unit: officialUnit },
      community: { price: suggestedPrice, currencyCode: suggestedCurrencyCode, unit: suggestedUnit },
      lastUpdate: {
        at: lastUpdateAt,
        source: lastUpdateSource,
        label: formatLastUpdatedAt(lastUpdateAt),
      },
      suggestion,
    };
  });
}
