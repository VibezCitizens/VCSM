// src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useUpdateStationFuelUnit } from "@/features/profiles/kinds/vport/hooks/gas/useUpdateStationFuelUnit";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";

import { useVportGasPrices } from "@/features/profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter";
import { useSubmitFuelPriceSuggestion } from "@/features/profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter";
import { useOwnerPendingSuggestions } from "@/features/profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
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
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId);

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
  } = useVportGasPrices({ actorId });

  const {
    loading: submitting,
    error: submitError,
    submit,
    publishFeedPost,
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

  const pendingSubmissions = useMemo(() => {
    const byKey = pendingByFuelKey || {};
    return Object.values(byKey)
      .filter(Boolean)
      .filter((s) => String(s?.status ?? "pending") === "pending");
  }, [pendingByFuelKey]);

  const serverUnit = useMemo(() => official?.[0]?.unit ?? "liter", [official]);
  const [localUnit, setLocalUnit] = useState(serverUnit);
  const [unitError, setUnitError] = useState(null);

  useEffect(() => {
    setLocalUnit(serverUnit);
  }, [serverUnit]);

  const { saving: savingUnit, updateUnit } = useUpdateStationFuelUnit({
    actorId: viewerActorId,
    targetActorId: actorId,
    onSuccess: refresh,
  });

  const handleUpdateUnit = useCallback(
    async (u) => {
      const prev = localUnit;
      setLocalUnit(u);
      setUnitError(null);
      const res = await updateUnit(u);
      if (!res?.ok) {
        setLocalUnit(prev);
        setUnitError(res?.reason ?? "Failed to update unit");
      }
    },
    [localUnit, updateUnit]
  );

  const afterSubmitSuggestion = useCallback(
    async ({ submissionId }) => {
      if (!submissionId) return { ok: false, reason: "no_submission_id" };

      const res = await reviewSuggestionAndRefresh?.({
        submissionId,
        decision: "approved",
        reason: "Owner updated official prices",
        applyToOfficialOnApprove: true,
      });

      return res;
    },
    [reviewSuggestionAndRefresh]
  );

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

  const section = {
    marginTop: 14,
    padding: 16,
  };

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
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Price unit</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginTop: 2 }}>Applies to all fuel types</div>
                {unitError && (
                  <div style={{ fontSize: 11, color: "rgba(239,68,68,0.9)", marginTop: 4 }}>{unitError}</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ key: "liter", label: "Liter" }, { key: "gallon", label: "Gallon" }].map(({ key, label }) => {
                  const active = localUnit === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={savingUnit || active}
                      onClick={() => handleUpdateUnit(key)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        border: active ? "1px solid rgba(251,146,60,0.50)" : "1px solid rgba(255,255,255,0.12)",
                        background: active ? "rgba(251,146,60,0.18)" : "rgba(255,255,255,0.05)",
                        color: active ? "rgba(251,146,60,1)" : "rgba(255,255,255,0.55)",
                        cursor: active || savingUnit ? "default" : "pointer",
                        transition: "all 0.15s",
                        opacity: savingUnit ? 0.6 : 1,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
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
              onShareToFeed={publishFeedPost}
              refresh={refresh}
            />
            <VportDashboardPendingGasPanel
              pendingLoading={pendingLoading}
              pendingError={pendingError}
              pendingSubmissions={pendingSubmissions}
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
