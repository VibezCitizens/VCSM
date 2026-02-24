// src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx

import React, { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";

import { useVportGasPrices } from "@/features/profiles/kinds/vport/hooks/gas/useVportGasPrices";
import { useSubmitFuelPriceSuggestion } from "@/features/profiles/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion";
import { useOwnerPendingSuggestions } from "@/features/profiles/kinds/vport/hooks/gas/useOwnerPendingSuggestions";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import {
  VportDashboardOfficialGasPanel,
  VportDashboardPendingGasPanel,
} from "@/features/dashboard/vport/screens/components/VportDashboardGasPanels";

export function VportDashboardGasScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity, identityLoading } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const isDesktop = useDesktopBreakpoint();
  const viewerActorId = identity?.actorId ?? null;
  const isOwner =
    Boolean(actorId) &&
    Boolean(viewerActorId) &&
    String(viewerActorId) === String(actorId);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  const openPublic = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/gas`);
  }, [navigate, actorId]);

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

  const {
    loading: pendingLoading,
    error: pendingError,
    communitySuggestionByFuelKey: pendingByFuelKey,
    reviewing,
    refresh: refreshPending,
    reviewSuggestion,
  } = useOwnerPendingSuggestions({
    actorId,
    identity,
  });

  const pendingSubmissions = useMemo(() => {
    const byKey = pendingByFuelKey || {};
    return Object.values(byKey)
      .filter(Boolean)
      .filter((s) => String(s?.status ?? "pending") === "pending");
  }, [pendingByFuelKey]);

  const onRefreshAll = useCallback(async () => {
    await Promise.allSettled([refresh?.(), refreshPending?.()]);
  }, [refresh, refreshPending]);

  const afterSubmitSuggestion = useCallback(
    async ({ submissionId }) => {
      if (!submissionId) return { ok: false, reason: "no_submission_id" };

      return reviewSuggestion?.({
        submissionId,
        decision: "approved",
        reason: "Owner updated official prices",
        applyToOfficialOnApprove: true,
      });
    },
    [reviewSuggestion]
  );

  if (!actorId) return null;
  if (identityLoading) {
    return <div className="p-10 text-center text-neutral-400">Loading...</div>;
  }
  if (!identity) {
    return (
      <div className="p-10 text-center text-neutral-400">Sign in required.</div>
    );
  }
  if (!isOwner) {
    return (
      <div className="p-10 text-center text-neutral-400">
        You can only manage gas prices for your own vport.
      </div>
    );
  }

  const shell = createVportDashboardShellStyles({ isDesktop });

  const section = {
    marginTop: 14,
    padding: 16,
  };

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={goBack} style={shell.btn("soft")} />

            <div style={shell.title}>GAS PRICES</div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onRefreshAll} style={shell.btn("soft")}>
                Refresh
              </button>
              <button type="button" onClick={openPublic} style={shell.btn("glow")}>
                Public page
              </button>
            </div>
          </div>

          <div style={section}>
            <VportDashboardOfficialGasPanel
              identityLoading={identityLoading}
              loading={loading}
              error={error}
              official={official}
              officialByFuelKey={officialByFuelKey}
              communitySuggestionByFuelKey={communitySuggestionByFuelKey}
              settings={settings}
              identity={identity}
              submitting={submitting}
              submitError={submitError}
              afterSubmitSuggestion={afterSubmitSuggestion}
              submitSuggestion={submit}
              refresh={refresh}
            />
            <VportDashboardPendingGasPanel
              pendingLoading={pendingLoading}
              pendingError={pendingError}
              pendingSubmissions={pendingSubmissions}
              reviewing={reviewing}
              officialByFuelKey={officialByFuelKey}
              reviewSuggestion={reviewSuggestion}
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
