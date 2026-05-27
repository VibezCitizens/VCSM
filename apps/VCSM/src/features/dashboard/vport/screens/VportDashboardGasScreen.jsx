// src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx

import React, { useCallback } from "react";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import { useAfterSubmitSuggestion } from "@/features/dashboard/vport/hooks/gas/useAfterSubmitSuggestion";
import { useGasUnitToggle } from "@/features/dashboard/vport/hooks/gas/useGasUnitToggle";

import { useVportGasPrices } from "@/features/profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter";
import { useSubmitFuelPriceSuggestion } from "@/features/profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter";
import { useOwnerPendingSuggestions } from "@/features/profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { GasUnitToggleBar } from "@/features/dashboard/vport/screens/components/GasUnitToggleBar";
import {
  VportDashboardOfficialGasPanel,
  VportDashboardPendingGasPanel,
} from "@/features/dashboard/vport/screens/components/VportDashboardGasPanels";

export function VportDashboardGasScreen() {
  const navigate = useNavigate();
  const { actorId } = useParams();
  const { identity, identityLoading } = useIdentity();

  const isDesktop = useDesktopBreakpoint();
  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId ?? null);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  const {
    loading,
    error,
    settings,
    official,
    officialByFuelKey,
    communitySuggestionByFuelKey,
    refresh,
  } = useVportGasPrices({ actorId: actorId ?? null });

  const { submit, publishFeedPost } = useSubmitFuelPriceSuggestion({
    targetActorId: actorId ?? null,
    identity,
  });

  const {
    loading: pendingLoading,
    error: pendingError,
    // Use pendingSubmissions directly from hook — avoids in-screen status filtering.
    // The hook already extracts pending-only items from the controller response.
    pendingSubmissions,
    reviewing,
    refresh: refreshPending,
    reviewSuggestion,
  } = useOwnerPendingSuggestions({
    actorId: actorId ?? null,
    identity,
  });

  const reviewSuggestionAndRefresh = useCallback(
    async (payload) => {
      const res = await reviewSuggestion?.(payload);
      if (res?.ok) {
        await Promise.allSettled([refresh?.(), refreshPending?.()]);
      }
      return res;
    },
    [reviewSuggestion, refresh, refreshPending]
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
              submitSuggestion={submit}
              onShareToFeed={publishFeedPost}
              refresh={refresh}
            />
            <VportDashboardPendingGasPanel
              pendingLoading={pendingLoading}
              pendingError={pendingError}
              pendingSubmissions={pendingSubmissions ?? []}
              reviewing={reviewing}
              officialByFuelKey={officialByFuelKey}
              reviewSuggestion={reviewSuggestionAndRefresh}
            />
          </div>
        </div>
      </div>
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
