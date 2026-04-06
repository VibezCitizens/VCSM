// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\view\VportGasPricesView.jsx

import { GasPricesPanel } from "@/features/profiles/kinds/vport/screens/gas/components/GasPricesPanel";
import { useVportGasPrices } from "@/features/profiles/kinds/vport/hooks/gas/useVportGasPrices";
import { useSubmitFuelPriceSuggestion } from "@/features/profiles/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion";

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
}) {
  const {
    loading,
    error,
    settings,
    official,
    officialByFuelKey,
    communitySuggestionByFuelKey,
    refresh,
  } = useVportGasPrices({ actorId });

  const {
    loading: submitting,
    error: submitError,
    submit,
  } = useSubmitFuelPriceSuggestion({
    targetActorId: actorId,
    identity,
  });

  return (
    <div className="profiles-card space-y-6 p-5">
      <GasPricesPanel
        loading={loading}
        error={error}
        official={official}
        officialByFuelKey={officialByFuelKey}
        communitySuggestionByFuelKey={communitySuggestionByFuelKey}
        settings={settings}
        identity={identity}
        submitting={submitting}
        submitSuggestion={async (payload) => {
          const res = await submit(payload);
          if (res?.ok) {
            await refresh();
          }
          return res;
        }}
      />

      {submitError ? (
        <div className="profiles-error rounded-2xl p-4 text-sm">
          {String(submitError?.message ?? submitError)}
        </div>
      ) : null}
    </div>
  );
}
