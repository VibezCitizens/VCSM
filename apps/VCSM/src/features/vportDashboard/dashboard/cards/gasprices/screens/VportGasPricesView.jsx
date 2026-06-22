import { useCallback, useState } from "react";

import { GasPricesPanel } from "@/features/vportDashboard/dashboard/cards/gasprices/components/GasPricesPanel";
import { useVportGasPrices } from "@/features/vportDashboard/dashboard/cards/gasprices/hooks/useVportGasPrices";
import { useSubmitFuelPriceSuggestion } from "@/features/vportDashboard/dashboard/cards/gasprices/hooks/useSubmitFuelPriceSuggestion";
import { normalizeGasError } from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasErrorMessages";

/**
 * View Screen — Gas Prices
 *
 * Composes hooks + components.
 * No DAL imports.
 * No business logic.
 */
export function VportGasPricesView({
  actorId,
  identity,
  isOwner = false,
}) {
  const {
    loading,
    error,
    settings,
    official,
    officialByFuelKey,
    communitySuggestionByFuelKey,
    patchOfficialRow,
    patchCommunityRow,
  } = useVportGasPrices({ actorId });

  const {
    error: submitError,
    submit,
    notifyBatchSubmission,
  } = useSubmitFuelPriceSuggestion({
    targetActorId: actorId,
    identity,
    isOwner,
  });

  // Derive canSubmit from the identity shape the screen provides.
  // identity may be a flat { actorId } object or a nested { identity: { actorId } }
  // shape depending on the caller context — normalise before reading actorId.
  const canSubmit = !!(identity?.identity ?? identity)?.actorId;

  // ── TEMPORARY DEADPOOL PROBE (TICKET-FUEL-BATCH-NOTIF-001) ──────────────────
  // DEV-only, on-screen. Captures the batch-notification payload + publish result
  // after each submit so we can prove whether the grouped notification fired and
  // succeeded. REMOVE after confirmation. No console.log; renders below the panel.
  const [batchDebug, setBatchDebug] = useState(null);
  const onBatchSubmittedProbed = useCallback(
    async (args) => {
      const res = await notifyBatchSubmission(args);
      if (import.meta.env.DEV) {
        setBatchDebug({ at: new Date().toISOString(), args, res });
      }
      return res;
    },
    [notifyBatchSubmission]
  );

  return (
    <div className="profiles-card space-y-6 p-5">
      <GasPricesPanel
        loading={loading}
        error={error}
        official={official}
        officialByFuelKey={officialByFuelKey}
        communitySuggestionByFuelKey={communitySuggestionByFuelKey}
        settings={settings}
        canSubmit={canSubmit}
        isStationOwner={isOwner}
        onBatchSubmitted={onBatchSubmittedProbed}
        submitSuggestion={async (payload) => {
          const res = await submit(payload);

          if (res?.ok) {
            if (res.submission) {
              // Citizen path: show community suggestion immediately.
              patchCommunityRow(res.submission.fuelKey, res.submission);
            } else {
              // Owner path: patch official price immediately.
              // Use server-returned row if available; fall back to input payload
              // so the UI always reflects the new value even if the upsert's
              // post-SELECT returns null (e.g. RLS filtering the SELECT result).
              patchOfficialRow(
                res.official ?? {
                  fuelKey: payload.fuelKey,
                  price: payload.proposedPrice,
                  currencyCode: payload.currencyCode ?? "USD",
                  unit: payload.unit ?? "liter",
                  updatedAt: new Date().toISOString(),
                  source: "manual",
                  isAvailable: true,
                }
              );
            }
            // No background refresh here — calling refresh() sets loading:true
            // which hides the price rows right as the modal closes, making the
            // update appear to vanish. The cache was already invalidated in the
            // controller, so the next mount/navigation fetches fresh data from DB.
          }

          return res;
        }}
      />

      {submitError ? (
        <div className="profiles-error rounded-2xl p-4 text-sm">
          {normalizeGasError(submitError)}
        </div>
      ) : null}

      {/* TEMPORARY DEADPOOL PROBE — DEV ONLY — remove after confirmation. */}
      {import.meta.env.DEV && batchDebug ? (
        <div
          className="rounded-2xl border border-amber-400/40 bg-black/60 p-3 text-[11px] leading-relaxed text-amber-200"
          role="status"
          aria-label="Deadpool batch notification probe"
        >
          <div className="font-semibold text-amber-300">DEADPOOL · batch notify probe</div>
          <div>at: {batchDebug.at}</div>
          <div>fuelKeys: {JSON.stringify(batchDebug.args?.fuelKeys ?? null)}</div>
          <div>count: {batchDebug.args?.fuelKeys?.length ?? 0}</div>
          <div>submissionBatchId: {String(batchDebug.args?.submissionBatchId ?? "null")}</div>
          <div>publish result: {JSON.stringify(batchDebug.res ?? null)}</div>
          <div className="mt-1 text-amber-400/70">
            published=true → row created · published=false → publish rejected/failed · (no probe line) → handler never fired
          </div>
        </div>
      ) : null}
    </div>
  );
}
