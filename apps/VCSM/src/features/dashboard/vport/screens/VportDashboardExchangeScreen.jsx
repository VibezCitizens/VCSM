// src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx

import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";
import Toast from "@/shared/components/components/Toast";

import VportRatesView from "@/features/profiles/adapters/kinds/vport/screens/rates/view/VportRatesView.jsx.adapter";
import VportRateEditorCard from "@/features/profiles/adapters/kinds/vport/screens/rates/components/VportRateEditorCard.jsx.adapter";
import useUpsertVportRate from "@/features/profiles/adapters/kinds/vport/hooks/rates/useUpsertVportRate.js.adapter";

function normalizeCurrencyCode(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function toNumOrNull(v) {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toRatePairKey({ rateType = "fx", baseCurrency, quoteCurrency }) {
  const safeRateType = String(rateType ?? "fx").trim().toLowerCase();
  const safeBase = normalizeCurrencyCode(baseCurrency);
  const safeQuote = normalizeCurrencyCode(quoteCurrency);
  if (!safeBase || !safeQuote) return null;
  return `${safeRateType}:${safeBase}/${safeQuote}`;
}

function mapRawRateRowToDomain(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id ?? null,
    actorId: row.actor_id ?? null,
    rateType: row.rate_type ?? "fx",
    baseCurrency: row.base_currency ?? null,
    quoteCurrency: row.quote_currency ?? null,
    buyRate: toNumOrNull(row.buy_rate),
    sellRate: toNumOrNull(row.sell_rate),
    meta: row.meta ?? {},
    updatedAt: row.updated_at ?? null,
    createdAt: row.created_at ?? null,
  };
}

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
  const [optimisticRatesByPair, setOptimisticRatesByPair] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const m = useUpsertVportRate({ actorId, rateType: "fx" });
  const optimisticRates = useMemo(
    () => Object.values(optimisticRatesByPair || {}),
    [optimisticRatesByPair]
  );

  const showToast = useCallback((message) => {
    setToastMessage(String(message || ""));
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 0);
  }, []);

  const onSave = useCallback(async () => {
    if (!actorId) return;
    const safeBase = normalizeCurrencyCode(baseCurrency);
    const safeQuote = normalizeCurrencyCode(quoteCurrency);
    const pairKey = toRatePairKey({
      rateType: "fx",
      baseCurrency: safeBase,
      quoteCurrency: safeQuote,
    });
    if (!pairKey) return;

    const nowIso = new Date().toISOString();
    const previousOptimistic = optimisticRatesByPair?.[pairKey] ?? null;
    const optimisticRate = {
      id: `optimistic:${pairKey}:${nowIso}`,
      actorId,
      rateType: "fx",
      baseCurrency: safeBase,
      quoteCurrency: safeQuote,
      buyRate: toNumOrNull(buyRate),
      sellRate: toNumOrNull(sellRate),
      meta: {},
      updatedAt: nowIso,
      createdAt: nowIso,
    };

    setOptimisticRatesByPair((prev) => ({
      ...prev,
      [pairKey]: optimisticRate,
    }));

    try {
      const saved = await m.upsert({
        actorId,
        rateType: "fx",
        baseCurrency: safeBase,
        quoteCurrency: safeQuote,
        buyRate,
        sellRate,
      });

      const mapped = mapRawRateRowToDomain(saved) ?? optimisticRate;
      setOptimisticRatesByPair((prev) => ({
        ...prev,
        [pairKey]: mapped,
      }));

      setBuyRate("");
      setSellRate("");
      setRefreshSeed((n) => n + 1);
      showToast(`New exchange rate published: ${safeBase}/${safeQuote}`);
    } catch {
      setOptimisticRatesByPair((prev) => {
        const next = { ...prev };
        if (previousOptimistic) next[pairKey] = previousOptimistic;
        else delete next[pairKey];
        return next;
      });
    }
  }, [
    m,
    actorId,
    baseCurrency,
    quoteCurrency,
    buyRate,
    sellRate,
    optimisticRatesByPair,
    showToast,
  ]);

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
              optimisticRates={optimisticRates}
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

export default VportDashboardExchangeScreen;
