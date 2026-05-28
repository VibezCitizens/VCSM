import React from "react";
import { GasPricesPanel } from "@/features/dashboard/vport/dashboard/cards/gasprices/components/GasPricesPanel";
import { GasStates } from "@/features/dashboard/vport/dashboard/cards/gasprices/components/GasStates";
import { OwnerPendingSuggestionsList } from "@/features/dashboard/vport/dashboard/cards/gasprices/components/OwnerPendingSuggestionsList";

const CARD_STYLE = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: 16,
  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
};

/**
 * Official gas prices panel — dashboard owner view.
 *
 * isOwner: verified by useVportOwnership in the parent screen.
 *   Passed through to GasPricesPanel so edit controls are explicitly owner-gated,
 *   not relying on allowOwnerUpdate prop alone.
 *
 * canSubmit: precomputed boolean (!!identity?.actorId) from parent screen.
 *   GasPricesPanel no longer receives the full identity object — only this flag.
 *
 * Note: No standalone GasStates here. GasPricesPanel manages its own loading/error/empty
 *   state internally. A prior version incorrectly rendered GasStates with identityLoading
 *   (always false at this render point due to early return in parent screen) — removed.
 */
export function VportDashboardOfficialGasPanel({
  loading,
  error,
  official,
  officialByFuelKey,
  communitySuggestionByFuelKey,
  settings,
  canSubmit,
  isOwner,
  afterSubmitSuggestion,
  submitSuggestion,
  onShareToFeed = null,
  onPublishResult = null,
  refresh,
}) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ fontWeight: 950, letterSpacing: 0.6 }}>Official prices</div>
      <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
        Update your station prices (bulk modal). Community last update is shown for reference.
      </div>

      <div style={{ marginTop: 14 }}>
        <GasPricesPanel
          loading={loading}
          error={error}
          official={official}
          officialByFuelKey={officialByFuelKey}
          communitySuggestionByFuelKey={communitySuggestionByFuelKey}
          settings={settings}
          canSubmit={canSubmit}
          isOwner={isOwner}
          allowOwnerUpdate={isOwner}
          afterSubmitSuggestion={afterSubmitSuggestion}
          onShareToFeed={onShareToFeed}
          onPublishResult={onPublishResult}
          submitSuggestion={submitSuggestion}
        />
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
