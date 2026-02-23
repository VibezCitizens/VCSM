// src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";

import VportRatesView from "@/features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx";
import VportRateEditorCard from "@/features/profiles/kinds/vport/screens/rates/components/VportRateEditorCard.jsx";
import useUpsertVportRate from "@/features/profiles/kinds/vport/hooks/rates/useUpsertVportRate.js";

export function VportDashboardExchangeScreen() {
  const navigate = useNavigate();
  const params = useParams();

  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  const [publicDetails, setPublicDetails] = useState(null);
  const [headerLoading, setHeaderLoading] = useState(false);

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 821px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(min-width: 821px)");
    const onChange = () => setIsDesktop(mq.matches);

    onChange();

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (!actorId) return;

    let alive = true;

    (async () => {
      setHeaderLoading(true);
      try {
        const d = await fetchVportPublicDetailsByActorId(actorId);
        if (!alive) return;
        setPublicDetails(d || null);
      } catch (e) {
        if (!alive) return;
        setPublicDetails(null);
      } finally {
        if (!alive) return;
        setHeaderLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [actorId]);

  const profile = useMemo(() => {
    return {
      displayName:
        publicDetails?.display_name ?? publicDetails?.name ?? "Exchange Rates",
      username: publicDetails?.username ?? "",
      tagline: publicDetails?.tagline ?? "",
      bannerUrl: publicDetails?.banner_url ?? publicDetails?.bannerUrl ?? "",
      avatarUrl: publicDetails?.avatar_url ?? publicDetails?.avatarUrl ?? "",
      actorId: actorId,
      actor_id: actorId,
    };
  }, [publicDetails, actorId]);

  const goBack = useCallback(() => {
    if (!actorId) return;
    navigate(`/actor/${actorId}/dashboard`);
  }, [navigate, actorId]);

  // ---------------------------
  // ✅ Owner editor state + hook
  // ---------------------------
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
    setRefreshSeed((n) => n + 1); // ✅ force reload of VportRatesView (see note below)
  }, [m, actorId, baseCurrency, quoteCurrency, buyRate, sellRate]);

  if (!actorId) return null;

  const bannerImage = profile.bannerUrl?.trim()
    ? `url(${profile.bannerUrl})`
    : null;
  const avatarImage = profile.avatarUrl?.trim()
    ? `url(${profile.avatarUrl})`
    : null;

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

  const content = (
    <div style={page}>
      <div style={container}>
        <div style={headerWrap}>
          <div style={topBar}>
            <button type="button" onClick={goBack} style={btn("soft")}>
              ← Back
            </button>

            <div style={{ fontWeight: 950, letterSpacing: 1.2 }}>
              EXCHANGE RATES
            </div>

            <div style={{ width: 110 }} />
          </div>

          <div
            style={{
              height: 170,
              position: "relative",
              backgroundColor: "#070812",
              backgroundImage: bannerImage
                ? bannerImage
                : "radial-gradient(900px 340px at 18% 20%, rgba(0,255,240,0.35), transparent 60%), radial-gradient(900px 340px at 82% 30%, rgba(124,58,237,0.30), transparent 62%), radial-gradient(700px 340px at 55% 90%, rgba(0,153,255,0.22), transparent 60%), linear-gradient(180deg, rgba(10,12,22,0.95), rgba(5,6,11,0.92))",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: bannerImage ? "saturate(1.05) contrast(1.05)" : "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
                pointerEvents: "none",
              }}
            />
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: 16,
              display: "flex",
              gap: 14,
              alignItems: "center",
              marginTop: -34,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: "#0b0b0f",
                backgroundImage: avatarImage ? avatarImage : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.65)",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                color: "rgba(255,255,255,0.65)",
                fontWeight: 950,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              {!avatarImage ? "VC" : null}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.6 }}>
                {headerLoading ? "Loading…" : profile.displayName}
              </div>

              {profile.username?.trim() ? (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.58)",
                    letterSpacing: 1.2,
                  }}
                >
                  @{profile.username}
                </div>
              ) : null}
            </div>
          </div>

          {/* ✅ OWNER EDITOR CARD */}
          <div className="px-4 pb-2">
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
              subtitle="Official rates • last updated shown per pair"
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