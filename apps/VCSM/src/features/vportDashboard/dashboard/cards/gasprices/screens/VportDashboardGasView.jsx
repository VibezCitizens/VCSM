import { useCallback, useState } from "react";

import { createVportDashboardShellStyles } from "@/features/vportDashboard/screens/styles/vportDashboardShellStyles";
import VportBackButton from "@/shared/ui/dashboard/BackButton";
import Toast from "@/shared/components/components/Toast";
import { GasUnitToggleBar } from "@/features/vportDashboard/dashboard/cards/gasprices/components/GasUnitToggleBar";
import {
  VportDashboardOfficialGasPanel,
  VportDashboardPendingGasPanel,
} from "@/features/vportDashboard/dashboard/cards/gasprices/components/VportDashboardGasPanels";
import { useGasUnitToggle } from "@/features/vportDashboard/dashboard/cards/gasprices/hooks/useGasUnitToggle";
import { useReviewFuelPriceBatch } from "@/features/vportDashboard/dashboard/cards/gasprices/hooks/useReviewFuelPriceBatch";
import { useSubmitFuelPriceSuggestion } from "@/features/vportDashboard/dashboard/cards/gasprices/hooks/useSubmitFuelPriceSuggestion";
import { useVportGasPrices } from "@/features/vportDashboard/dashboard/cards/gasprices/hooks/useVportGasPrices";
import {
  buildBatchApproveMessage,
  buildBatchRejectMessage,
} from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasPrices.model";

// TICKET-SEC-GASFUEL-REVIEW-001 (BW-1): keep the owner informed when a batch
// review fails instead of silently no-op'ing. Surfaces only the reason already
// returned by the review controllers — no new data, no behavior change.
function batchReviewErrorMessage(reason) {
  if (reason === "not_owner") return "You don't have permission to review this batch.";
  return "Could not complete batch review. Please try again.";
}

export function VportDashboardGasView({ actorId, identity, isDesktop, isOwner, onBack }) {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message) => {
    setToastMessage(String(message || ""));
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 0);
  }, []);

  const handlePublishResult = useCallback(
    (result) => {
      if (!result) return;
      if (result.status === "published") showToast("Fuel update shared to feed.");
      else if (result.status === "skipped") showToast(`Fuel update saved. Feed share skipped: ${result.reason ?? "recent post"}`);
      else showToast("Fuel update saved. Feed share failed.");
    },
    [showToast]
  );

  const {
    loading,
    error,
    settings,
    official,
    officialByFuelKey,
    communitySuggestionByFuelKey,
    pendingBatches,
    refresh,
    patchOfficialRow,
  } = useVportGasPrices({ actorId });

  const { submit, publishFeedPost } = useSubmitFuelPriceSuggestion({
    targetActorId: actorId,
    identity,
    isOwner,
  });

  const submitSuggestion = useCallback(
    async (payload) => {
      const res = await submit(payload);
      if (res?.ok && !res.submission) {
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
      return res;
    },
    [submit, patchOfficialRow]
  );

  // Batch review: Approve All / Reject All act on a whole citizen submission
  // batch through the secure RPC. The active actor (owner/manager) is enforced
  // inside the RPC; we only pass the station actor + batch id.
  const { reviewing, approveBatch, rejectBatch } = useReviewFuelPriceBatch({
    targetActorId: actorId,
    onRefresh: refresh,
  });

  // TICKET-SEC-GASFUEL-REVIEW-001 (BW-1 / BW-4): surface the applied / stale-skipped
  // / rejected counts the batch RPC already returns, so the owner understands when
  // an approved batch did NOT change official prices (stale-skip) instead of seeing
  // the card silently disappear. Wraps the existing handlers only — no new API call,
  // no change to approval / grouping / stale-protection logic.
  const handleApproveBatch = useCallback(
    async (payload) => {
      // TICKET-FUEL-BATCH-FEED-POST-001 (Option A): capture the matching batch
      // BEFORE approveBatch triggers the refresh that clears pending — the closure
      // still holds the pre-refresh batch (with its submission fuel rows).
      const batch = (pendingBatches ?? []).find(
        (b) => b.submissionBatchId === payload?.submissionBatchId
      );

      const res = await approveBatch(payload);
      if (res?.ok) showToast(buildBatchApproveMessage(res.result));
      else if (res?.reason) showToast(batchReviewErrorMessage(res.reason));

      // Parity with the owner-direct "share to feed" post — app-layer only, no RPC
      // change. Publish ONLY on a CLEAN apply (every approved row applied to
      // official). All-stale (appliedCount 0) and partial-stale
      // (appliedCount < approvedCount) batches publish nothing. For applied rows
      // official price == the batch proposed price, so the batch submissions are
      // the applied official values. publishFeedPost authors as the active gas
      // VPORT actor (isOwner-gated) — never the citizen — and self-throttles.
      if (
        res?.ok &&
        res.result?.appliedCount > 0 &&
        res.result.appliedCount === res.result.approvedCount &&
        batch?.submissions?.length
      ) {
        const updatedFuels = batch.submissions.map((s) => ({
          fuelKey: s.fuelKey,
          price: s.proposedPrice,
          currencyCode: s.currencyCode ?? "USD",
          unit: s.unit,
        }));
        const publishResult = await publishFeedPost({ updatedFuels });
        handlePublishResult(publishResult);
      }

      return res;
    },
    [approveBatch, showToast, pendingBatches, publishFeedPost, handlePublishResult]
  );

  const handleRejectBatch = useCallback(
    async (payload) => {
      const res = await rejectBatch(payload);
      if (res?.ok) showToast(buildBatchRejectMessage(res.result));
      else if (res?.reason) showToast(batchReviewErrorMessage(res.reason));
      return res;
    },
    [rejectBatch, showToast]
  );

  const { localUnit, unitError, savingUnit, handleUpdateUnit } = useGasUnitToggle({
    official,
    viewerActorId: identity?.actorId ?? null,
    actorId,
    onSuccess: refresh,
  });

  const shell = createVportDashboardShellStyles({ isDesktop });
  const section = { marginTop: 14, padding: 16 };

  return (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={onBack} />
            <div style={shell.title}>GAS PRICES</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: "12px 16px 0" }}>
            <GasUnitToggleBar
              value={localUnit}
              onChange={handleUpdateUnit}
              disabled={savingUnit}
              unitError={unitError}
            />
          </div>

          <div style={section}>
            <VportDashboardOfficialGasPanel
              loading={loading}
              error={error}
              official={official}
              officialByFuelKey={officialByFuelKey}
              communitySuggestionByFuelKey={communitySuggestionByFuelKey}
              settings={settings}
              canSubmit={!!identity?.actorId}
              isOwner={isOwner}
              submitSuggestion={submitSuggestion}
              onShareToFeed={publishFeedPost}
              onPublishResult={handlePublishResult}
              refresh={refresh}
            />
            <VportDashboardPendingGasPanel
              pendingLoading={loading}
              pendingError={error}
              pendingBatches={pendingBatches ?? []}
              reviewing={reviewing}
              officialByFuelKey={officialByFuelKey}
              onApproveBatch={handleApproveBatch}
              onRejectBatch={handleRejectBatch}
            />
          </div>
        </div>
      </div>
      <Toast
        open={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}

export default VportDashboardGasView;
