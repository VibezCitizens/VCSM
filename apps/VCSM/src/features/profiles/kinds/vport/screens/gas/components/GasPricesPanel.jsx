import { useMemo, useState } from "react";
import { GasStates } from "@/features/profiles/kinds/vport/screens/gas/components/GasStates";
import { BulkUpdateFuelPricesModal } from "@/features/profiles/kinds/vport/screens/gas/components/BulkUpdateFuelPricesModal";
import {
  resolveFuelKeys,
  buildFuelPriceRows,
} from "@/features/profiles/kinds/vport/model/gas/gasPrices.model";

/**
 * GasPricesPanel
 *
 * Displays official fuel prices + last community update for a gas station VPORT.
 * Handles the "Update prices" CTA for owners (bulk modal) and citizen suggestions.
 *
 * Props:
 *   canSubmit       — boolean: true when the viewer is authenticated and may submit prices.
 *                     Computed by callers from identity?.actorId. Replaces the full identity
 *                     object, which was only ever used to derive this single boolean.
 *   isOwner         — verified ownership from useVportOwnership (passed explicitly).
 *                     Hardens the edit control gate: allowOwnerUpdate alone is not enough.
 *   allowOwnerUpdate — signals that this render context supports owner-level price updates.
 *                     Must be true AND isOwner must be true for owner edit controls to appear.
 *   isStationOwner  — used by the PUBLIC gas screen to suppress the "Update prices"
 *                     button for owners viewing their own station (they should use dashboard).
 */
export function GasPricesPanel({
  loading,
  error,
  official = [],
  officialByFuelKey = {},
  communitySuggestionByFuelKey = {},
  settings,
  canSubmit = false,
  submitSuggestion,
  allowOwnerUpdate = false,
  isOwner = false,
  isStationOwner = false,
  afterSubmitSuggestion = null,
  onShareToFeed = null,
}) {
  const [showBulkModal, setShowBulkModal] = useState(false);

  const fuelKeys = useMemo(
    () => resolveFuelKeys({ settings, official, officialByFuelKey, communitySuggestionByFuelKey }),
    [settings, official, officialByFuelKey, communitySuggestionByFuelKey]
  );

  const rows = useMemo(
    () => buildFuelPriceRows({ fuelKeys, official, officialByFuelKey, communitySuggestionByFuelKey }),
    [fuelKeys, official, officialByFuelKey, communitySuggestionByFuelKey]
  );

  const empty = !loading && !error && rows.length === 0;

  /**
   * showUpdateButton logic:
   *
   *   Owner dashboard path: allowOwnerUpdate=true AND isOwner=true → show bulk update button.
   *     isOwner is verified by useVportOwnership in the parent screen — making the gate explicit.
   *     allowOwnerUpdate alone is insufficient: avoids showing edit controls if prop is
   *     accidentally set in a non-owner render context.
   *
   *   Public page, owner viewing own: isStationOwner=true → hide button (use dashboard instead).
   *
   *   Public page, citizen: show button to submit a suggestion.
   */
  const showUpdateButton = useMemo(() => {
    if (!canSubmit) return false;
    if (allowOwnerUpdate && isOwner) return true;
    if (isStationOwner) return false;
    return true;
  }, [canSubmit, allowOwnerUpdate, isOwner, isStationOwner]);

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
                aria-label="Update fuel prices"
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
                  role="region"
                  aria-label={`${row.label} fuel prices`}
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
                          <div className="mt-1 text-xl font-semibold text-white" aria-label={`Official ${row.label} price: ${row.official.price ?? 'not set'}`}>
                            {row.official.price ?? "—"}
                          </div>
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
            submitSuggestion={submitSuggestion}
            afterSubmitSuggestion={afterSubmitSuggestion}
            canShareToFeed={allowOwnerUpdate && isOwner}
            onShareToFeed={onShareToFeed}
          />
        </>
      )}
    </div>
  );
}
