// src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx

import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";

import VportRatesView from "@/features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx";
import VportRateEditorCard from "@/features/profiles/kinds/vport/screens/rates/components/VportRateEditorCard.jsx";
import useUpsertVportRate from "@/features/profiles/kinds/vport/hooks/rates/useUpsertVportRate.js";

export function VportDashboardExchangeScreen() {
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

  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [quoteCurrency, setQuoteCurrency] = useState("MXN");
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [refreshSeed, setRefreshSeed] = useState(0);

  const m = useUpsertVportRate({ actorId, rateType: "fx" });

  const onSave = useCallback(async () => {
    if (!actorId) return;

    await m.upsert({
      actorId,
      rateType: "fx",
      baseCurrency,
      quoteCurrency,
      buyRate,
      sellRate,
    });

    setBuyRate("");
    setSellRate("");
    setRefreshSeed((n) => n + 1);
  }, [m, actorId, baseCurrency, quoteCurrency, buyRate, sellRate]);

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
        You can only manage exchange rates for your own vport.
      </div>
    );
  }

  const profile = {
    actorId,
    actor_id: actorId,
  };

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
    maxWidth: isDesktop ? 1280 : 900,
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

  const btn = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: 0.3,
  };

  const content = (
    <div style={page}>
      <div style={container}>
        <div style={headerWrap}>
          <div style={topBar}>
            <button type="button" onClick={goBack} style={btn}>
              {isDesktop ? "<- Back" : "<"}
            </button>

            <div style={{ fontWeight: 950, letterSpacing: 1.2 }}>
              EXCHANGE RATES
            </div>

            <div style={{ width: 110 }} />
          </div>

          <div style={{ padding: "0 16px 8px 16px" }}>
            <VportRateEditorCard
              title="Update Rate"
              baseCurrency={baseCurrency}
              quoteCurrency={quoteCurrency}
              buyRate={buyRate}
              sellRate={sellRate}
              onChangeBaseCurrency={setBaseCurrency}
              onChangeQuoteCurrency={setQuoteCurrency}
              onChangeBuyRate={setBuyRate}
              onChangeSellRate={setSellRate}
              onSubmit={onSave}
              submitting={m.isLoading}
              error={m.error?.message ?? m.error ?? null}
              disabled={false}
            />
          </div>

          <div style={{ padding: "0 0 6px 0" }}>
            <VportRatesView
              profile={profile}
              actorId={actorId}
              rateType="fx"
              title="Exchange Rates"
              subtitle="Official rates - last updated shown per pair"
              refreshSeed={refreshSeed}
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

export default VportDashboardExchangeScreen;
