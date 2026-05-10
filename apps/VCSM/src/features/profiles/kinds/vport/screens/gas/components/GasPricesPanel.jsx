import { useMemo, useState } from "react";
import { GasStates } from "@/features/profiles/kinds/vport/screens/gas/components/GasStates";
import { BulkUpdateFuelPricesModal } from "@/features/profiles/kinds/vport/screens/gas/components/BulkUpdateFuelPricesModal";
import { toEpochMs, formatLastUpdatedAt, prettyFuelLabel } from "@/features/profiles/kinds/vport/screens/gas/components/gasPrices.model";

export function GasPricesPanel({
  loading,
  error,
  official = [],
  officialByFuelKey = {},
  communitySuggestionByFuelKey = {},
  settings,
  identity,
  submitSuggestion,
  submitting = false,
  allowOwnerUpdate = false,
  isStationOwner = false,
  afterSubmitSuggestion = null,
  onShareToFeed = null,
}) {
  const [showBulkModal, setShowBulkModal] = useState(false);

  const me = useMemo(() => identity?.identity ?? identity ?? null, [identity]);
  const canSubmit = !!me?.actorId;

  const fuelKeys = useMemo(() => {
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
  }, [settings, official, officialByFuelKey, communitySuggestionByFuelKey]);

  const rows = useMemo(() => {
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
      const suggestedCurrencyCode = suggestion?.currencyCode ?? suggestion?.currency_code ?? officialCurrencyCode;
      const suggestedUnit = suggestion?.unit ?? officialUnit;
      const suggestionSubmittedAt = suggestion?.submittedAt ?? suggestion?.submitted_at ?? null;

      const officialUpdatedMs = toEpochMs(officialUpdatedAt);
      const suggestionSubmittedMs = toEpochMs(suggestionSubmittedAt);

      let lastUpdateAt = null;
      let lastUpdateSource = "none";
      if (suggestionSubmittedMs !== null && (officialUpdatedMs === null || suggestionSubmittedMs >= officialUpdatedMs)) {
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
        lastUpdate: { at: lastUpdateAt, source: lastUpdateSource, label: formatLastUpdatedAt(lastUpdateAt) },
        suggestion,
      };
    });
  }, [fuelKeys, official, officialByFuelKey, communitySuggestionByFuelKey]);

  const empty = !loading && !error && rows.length === 0;

  const showUpdateButton = useMemo(() => {
    if (!canSubmit) return false;
    if (allowOwnerUpdate) return true;
    if (isStationOwner) return false;
    return true;
  }, [canSubmit, allowOwnerUpdate, isStationOwner]);

  return (
    <div className="space-y-4">
      <GasStates loading={loading} error={error} empty={empty} />

      {!loading && !error && !empty && (
        <>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[18px] font-semibold tracking-tight text-white">Fuel Prices</div>
              <div className="mt-0.5 text-xs text-white/50">Official rates + last community update</div>
            </div>
            {showUpdateButton ? (
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="shrink-0 rounded-2xl border border-sky-300/35 bg-gradient-to-b from-sky-300/40 to-blue-500/40 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(56,189,248,0.22)] transition hover:from-sky-300/55 hover:to-blue-500/55 active:scale-[0.98]"
              >
                Update prices
              </button>
            ) : !canSubmit ? (
              <div className="text-xs text-white/40">Log in to update</div>
            ) : null}
          </div>

          <div className="space-y-3">
            {rows.map((row) => {
              const hasCommunityUpdate = row.lastUpdate?.source === "community";
              const hasOfficialUpdate = row.lastUpdate?.source === "official";
              const hasAnyUpdate = Boolean(row.lastUpdate?.label);
              return (
                <div
                  key={row.fuelKey}
                  className="profiles-subcard relative overflow-hidden rounded-3xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-white/10" />
                  <div className="pointer-events-none absolute -top-24 right-[-60px] h-52 w-52 rounded-full bg-purple-500/10 blur-3xl" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-white">{row.label}</div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                          {row.official.currencyCode}/{row.official.unit}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <div className="text-[11px] uppercase tracking-wide text-white/50">Official</div>
                          <div className="mt-1 text-xl font-semibold text-white">{row.official.price ?? "—"}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] uppercase tracking-wide text-white/50">Last update</div>
                            {hasCommunityUpdate ? (
                              <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[11px] text-sky-200">Community</span>
                            ) : hasOfficialUpdate ? (
                              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] text-emerald-200">Official</span>
                            ) : (
                              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/50">None yet</span>
                            )}
                          </div>
                          <div className="mt-1 text-xl font-semibold text-white">
                            {hasCommunityUpdate && row.community.price != null
                              ? row.community.price
                              : hasOfficialUpdate && row.official.price != null
                              ? row.official.price
                              : "—"}
                          </div>
                          {hasAnyUpdate && row.lastUpdate.label ? (
                            <div className="mt-0.5 text-[10px] text-white/40">{row.lastUpdate.label}</div>
                          ) : null}
                        </div>
                      </div>
                      {!hasCommunityUpdate ? (
                        <div className="mt-2 text-xs text-white/40">Be the first to update this station.</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <BulkUpdateFuelPricesModal
            open={showBulkModal}
            onClose={() => setShowBulkModal(false)}
            rows={rows}
            submitting={submitting}
            submitSuggestion={submitSuggestion}
            afterSubmitSuggestion={afterSubmitSuggestion}
            canShareToFeed={allowOwnerUpdate}
            onShareToFeed={onShareToFeed}
          />
        </>
      )}
    </div>
  );
}
