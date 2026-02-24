// src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx

import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";

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

  const shell = createVportDashboardShellStyles({
    isDesktop,
    maxWidthDesktop: 1280,
  });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={goBack} style={shell.btn("soft")} />
            <div style={shell.title}>EXCHANGE RATES</div>
            <div style={shell.rightSpacer} />
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
