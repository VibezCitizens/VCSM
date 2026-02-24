import React from "react";
import { GasPricesPanel } from "@/features/profiles/kinds/vport/screens/gas/components/GasPricesPanel";
import { GasStates } from "@/features/profiles/kinds/vport/screens/gas/components/GasStates";
import { OwnerPendingSuggestionsList } from "@/features/profiles/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList";

const CARD_STYLE = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: 16,
  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
};

export function VportDashboardOfficialGasPanel({
  identityLoading,
  loading,
  error,
  official,
  officialByFuelKey,
  communitySuggestionByFuelKey,
  settings,
  identity,
  submitting,
  submitError,
  afterSubmitSuggestion,
  submitSuggestion,
  refresh,
}) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ fontWeight: 950, letterSpacing: 0.6 }}>Official prices</div>
      <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
        Update your station prices (bulk modal). Community last update is shown for reference.
      </div>

      <div style={{ marginTop: 14 }}>
        <GasStates loading={identityLoading} error={null} empty={false} />
        <GasPricesPanel
          loading={loading}
          error={error}
          official={official}
          officialByFuelKey={officialByFuelKey}
          communitySuggestionByFuelKey={communitySuggestionByFuelKey}
          settings={settings}
          identity={identity}
          submitting={submitting}
          allowOwnerUpdate={true}
          afterSubmitSuggestion={afterSubmitSuggestion}
          submitSuggestion={async (payload) => {
            const res = await submitSuggestion(payload);
            if (res?.ok) await refresh();
            return res;
          }}
        />
        {submitError ? (
          <div className="mt-4 rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
            {String(submitError?.message ?? submitError)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function VportDashboardPendingGasPanel({
  pendingLoading,
  pendingError,
  pendingSubmissions,
  reviewing,
  officialByFuelKey,
  reviewSuggestion,
}) {
  return (
    <div style={{ ...CARD_STYLE, marginTop: 14 }}>
      <div style={{ fontWeight: 950, letterSpacing: 0.6 }}>
        Pending community suggestions
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
        Approve or reject submissions. Approve can apply to official if enabled.
      </div>

      <div style={{ marginTop: 14 }}>
        <GasStates
          loading={pendingLoading}
          error={pendingError}
          empty={!pendingLoading && !pendingError && pendingSubmissions.length === 0}
        />
        {!pendingLoading && !pendingError ? (
          <OwnerPendingSuggestionsList
            submissions={pendingSubmissions}
            officialByFuelKey={officialByFuelKey}
            reviewing={reviewing}
            onApprove={async ({ submissionId, reason }) => {
              return reviewSuggestion?.({
                submissionId,
                decision: "approved",
                reason,
                applyToOfficialOnApprove: true,
              });
            }}
            onReject={async ({ submissionId, reason }) => {
              return reviewSuggestion?.({
                submissionId,
                decision: "rejected",
                reason,
                applyToOfficialOnApprove: false,
              });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

