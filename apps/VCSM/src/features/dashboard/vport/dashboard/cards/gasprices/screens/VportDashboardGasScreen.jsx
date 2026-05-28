// src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx

import React, { useCallback, useState } from "react";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import { useAfterSubmitSuggestion } from "@/features/dashboard/vport/dashboard/cards/gasprices/hooks/useAfterSubmitSuggestion";
import { useGasUnitToggle } from "@/features/dashboard/vport/dashboard/cards/gasprices/hooks/useGasUnitToggle";

import { useVportGasPrices } from "@/features/dashboard/vport/dashboard/cards/gasprices/hooks/useVportGasPrices";
import { useSubmitFuelPriceSuggestion } from "@/features/dashboard/vport/dashboard/cards/gasprices/hooks/useSubmitFuelPriceSuggestion";
import { useOwnerPendingSuggestions } from "@/features/dashboard/vport/dashboard/cards/gasprices/hooks/useOwnerPendingSuggestions";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/shared/components/BackButton";
import Toast from "@/shared/components/components/Toast";
import { GasUnitToggleBar } from "@/features/dashboard/vport/dashboard/cards/gasprices/components/GasUnitToggleBar";
import {
  VportDashboardOfficialGasPanel,
  VportDashboardPendingGasPanel,
} from "@/features/dashboard/vport/dashboard/cards/gasprices/components/VportDashboardGasPanels";

export function VportDashboardGasScreen() {
  const navigate = useNavigate();
  const { actorId } = useParams();
  const { identity, identityLoading } = useIdentity();

  const isDesktop = useDesktopBreakpoint();
  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId ?? null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

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
    pendingSubmissions,
    refresh,
    patchOfficialRow,
  } = useVportGasPrices({ actorId: actorId ?? null });

  const { submit, publishFeedPost } = useSubmitFuelPriceSuggestion({
    targetActorId: actorId ?? null,
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

  const { reviewing, reviewSuggestion } = useOwnerPendingSuggestions({
    identity,
    onRefresh: refresh,
  });

  const reviewSuggestionAndRefresh = useCallback(
    async (payload) => reviewSuggestion?.(payload),
    [reviewSuggestion]
  );

  const { localUnit, unitError, savingUnit, handleUpdateUnit } = useGasUnitToggle({
    official,
    viewerActorId,
    actorId: actorId ?? null,
    onSuccess: refresh,
  });

  const { afterSubmitSuggestion } = useAfterSubmitSuggestion({ reviewSuggestionAndRefresh });

  if (!actorId) return null;
  if (identityLoading || ownershipLoading) {
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  }
  if (!identity) {
    return (
      <div className="p-10 text-center text-white/50">Sign in required.</div>
    );
  }
  if (!isOwner) {
    return (
      <div className="p-10 text-center text-white/50">
        You can only manage gas prices for your own vport.
      </div>
    );
  }

  const shell = createVportDashboardShellStyles({ isDesktop });
  const section = { marginTop: 14, padding: 16 };

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={goBack} />
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
              afterSubmitSuggestion={afterSubmitSuggestion}
              submitSuggestion={submitSuggestion}
              onShareToFeed={publishFeedPost}
              onPublishResult={handlePublishResult}
              refresh={refresh}
            />
            <VportDashboardPendingGasPanel
              pendingLoading={loading}
              pendingError={error}
              pendingSubmissions={pendingSubmissions ?? []}
              reviewing={reviewing}
              officialByFuelKey={officialByFuelKey}
              reviewSuggestion={reviewSuggestionAndRefresh}
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

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "auto",
          background: "#000",
        }}
      >
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

export default VportDashboardGasScreen;
