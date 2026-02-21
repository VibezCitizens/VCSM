// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\dashboard\vport\screens\VportDashboardGasScreen.jsx

import React, { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";

import { GasPricesPanel } from "@/features/profiles/kinds/vport/screens/gas/components/GasPricesPanel";
import { GasStates } from "@/features/profiles/kinds/vport/screens/gas/components/GasStates";

import { useVportGasPrices } from "@/features/profiles/kinds/vport/hooks/gas/useVportGasPrices";
import { useSubmitFuelPriceSuggestion } from "@/features/profiles/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion";

import { useOwnerPendingSuggestions } from "@/features/profiles/kinds/vport/hooks/gas/useOwnerPendingSuggestions";
import { OwnerPendingSuggestionsList } from "@/features/profiles/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList";

export function VportDashboardGasScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity, identityLoading } = useIdentity();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  // ✅ desktop detect (same pattern as your dashboard)
  const isDesktop = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 821px)").matches;
  }, []);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  const openPublic = useCallback(() => {
    if (!actorId) return;
    // citizen/public gas page
    navigate(`/actor/${actorId}/gas`);
  }, [navigate, actorId]);

  // =======================
  // Official + latest community (for the panel UI)
  // =======================
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

  // =======================
  // Pending suggestions (owner review)
  // =======================
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

  // ✅ Owner bulk update -> auto-approve + apply to official
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

  // =======================
  // Layout styling (kept close to your dashboard style)
  // =======================
  const page = {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
    color: "#fff",
    padding: 18,
  };

  const container = {
    width: "100%",
    maxWidth: isDesktop ? 1100 : 900,
    margin: "0 auto",
    paddingBottom: 56,
  };

  const headerWrap = {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(12,14,24,0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
  };

  const topBar = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
  };

  const btn = (variant = "soft") => ({
    padding: "10px 12px",
    borderRadius: 14,
    border:
      variant === "soft"
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(0,255,240,0.22)",
    background:
      variant === "soft"
        ? "rgba(255,255,255,0.06)"
        : "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: 0.3,
  });

  const section = {
    marginTop: 14,
    padding: 16,
  };

  const card = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 16,
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
  };

  if (!actorId) return null;

  const content = (
    <div style={page}>
      <div style={container}>
        <div style={headerWrap}>
          <div style={topBar}>
            <button type="button" onClick={goBack} style={btn("soft")}>
              ← Dashboard
            </button>

            <div style={{ fontWeight: 950, letterSpacing: 1.2 }}>
              GAS PRICES (OWNER)
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onRefreshAll} style={btn("soft")}>
                Refresh
              </button>
              <button type="button" onClick={openPublic} style={btn("glow")}>
                Public page
              </button>
            </div>
          </div>

          <div style={section}>
            {/* ✅ OFFICIAL PRICES UPDATE (THIS IS WHERE YOU UPDATE GAS) */}
            <div style={card}>
              <div style={{ fontWeight: 950, letterSpacing: 0.6 }}>
                Official prices
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Update your station’s prices (bulk modal). Community “last update” is shown for reference.
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
                    const res = await submit(payload);
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

            {/* ✅ PENDING COMMUNITY SUGGESTIONS */}
            <div style={{ ...card, marginTop: 14 }}>
              <div style={{ fontWeight: 950, letterSpacing: 0.6 }}>
                Pending community suggestions
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Approve or reject submissions. Approve can apply to official if enabled.
              </div>

              <div style={{ marginTop: 14 }}>
                <GasStates
                  loading={pendingLoading}
                  error={pendingError}
                  empty={
                    !pendingLoading &&
                    !pendingError &&
                    pendingSubmissions.length === 0
                  }
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