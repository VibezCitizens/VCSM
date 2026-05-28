import { GasPricesPanel } from "@/features/dashboard/vport/dashboard/cards/gasprices/components/GasPricesPanel";
import { useVportGasPrices } from "@/features/dashboard/vport/dashboard/cards/gasprices/hooks/useVportGasPrices";
import { useSubmitFuelPriceSuggestion } from "@/features/dashboard/vport/dashboard/cards/gasprices/hooks/useSubmitFuelPriceSuggestion";
import { normalizeGasError } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/gasErrorMessages";

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
  } = useSubmitFuelPriceSuggestion({
    targetActorId: actorId,
    identity,
    isOwner,
  });

  // Derive canSubmit from the identity shape the screen provides.
  // identity may be a flat { actorId } object or a nested { identity: { actorId } }
  // shape depending on the caller context — normalise before reading actorId.
  const canSubmit = !!(identity?.identity ?? identity)?.actorId;

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
    </div>
  );
}
