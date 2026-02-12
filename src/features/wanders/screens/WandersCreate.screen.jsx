// src/features/wanders/screens/WandersCreate.screen.jsx
import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import CardBuilder from "@/features/wanders/components/cardstemplates/CardBuilder";
import { publishWandersFromBuilder } from "@/features/wanders/core/controllers/publishWandersFromBuilder.controller";

export default function WandersCreateScreen({ realmId: realmIdProp, baseUrl: baseUrlProp }) {
  const navigate = useNavigate();
  const location = useLocation();

  const realmId = realmIdProp || location?.state?.realmId || null;

  const baseUrl = useMemo(() => {
    if (baseUrlProp) return baseUrlProp;
    if (location?.state?.baseUrl) return location.state.baseUrl;
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {}
    return "";
  }, [baseUrlProp, location?.state?.baseUrl]);

  const { ensureUser } = useWandersGuest({ auto: true });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = useCallback(
    async (payload) => {
      if (!realmId) return;

      setSubmitting(true);
      setError(null);

      try {
        await Promise.resolve(ensureUser?.());

        const res = await publishWandersFromBuilder({
          realmId,
          baseUrl,
          payload,
        });

        const publicId = res?.publicId || null;
        const url = res?.url || null;

        if (publicId) {
          navigate(`/wanders/sent/${publicId}`);
          return;
        }
        if (url) window.location.assign(url);
      } catch (e) {
        setError(e);
      } finally {
        setSubmitting(false);
      }
    },
    [realmId, ensureUser, baseUrl, navigate]
  );

  if (!realmId) {
    return <WandersEmptyState title="Missing realm" subtitle="Pass realmId into WandersCreateScreen." />;
  }

  return (
    <div style={styles.page}>
      {/* background glow like Sent */}
      <div aria-hidden style={styles.bgGlow} />

      {/* header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerRow}>
            <div>
              <div style={styles.h1}>Create a Card</div>
              <div style={styles.subhead}>Pick a style, write a message, share a link.</div>
            </div>

            <button type="button" onClick={() => navigate("/wanders")} style={styles.btnLift}>
              <span aria-hidden style={styles.btnSheen} />
              <span aria-hidden style={styles.btnInnerRing} />
              <span style={styles.btnLabel}>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* content */}
      <main style={styles.main}>
        {submitting ? <WandersLoading /> : null}

        {/* glass box wrapper like Sent */}
        <div style={styles.dashBox}>
          <div aria-hidden style={styles.glowTL} />
          <div aria-hidden style={styles.glowBR} />

          <div style={styles.dashBoxInner}>
            <CardBuilder defaultCardType="generic" loading={submitting} error={error} onSubmit={onSubmit} />
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    width: "100%",
    height: "100dvh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    background: "#000",
    color: "#fff",
  },

  bgGlow: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(600px 200px at 50% -80px, rgba(168,85,247,0.15), transparent)",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.70)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  headerInner: {
    width: "100%",
    maxWidth: 896, // ~max-w-4xl
    margin: "0 auto",
    padding: "0 16px",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 0",
  },
  h1: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  subhead: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(228,228,231,0.85)", // zinc-300-ish
  },

  main: {
    position: "relative",
    width: "100%",
    maxWidth: 896,
    margin: "0 auto",
    padding: "24px 16px 96px",
    boxSizing: "border-box",
  },

  dashBox: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow:
      "0 16px 40px rgba(0,0,0,0.55), 0 0 36px rgba(124,58,237,0.10)",
    padding: 16,
    boxSizing: "border-box",
  },
  dashBoxInner: {
    position: "relative",
  },

  glowTL: {
    pointerEvents: "none",
    position: "absolute",
    top: -64,
    left: -64,
    width: 224,
    height: 224,
    borderRadius: 9999,
    background: "rgba(139,92,246,0.10)", // violet glow
    filter: "blur(48px)",
  },
  glowBR: {
    pointerEvents: "none",
    position: "absolute",
    right: -80,
    bottom: -80,
    width: 288,
    height: 288,
    borderRadius: 9999,
    background: "rgba(217,70,239,0.08)", // fuchsia glow
    filter: "blur(56px)",
  },

  // Sent-like “more visual” button (no tailwind)
  btnLift: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    background: "rgba(24,24,27,0.90)", // zinc-900/90
    border: "1px solid rgba(255,255,255,0.15)",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 800,
    color: "#fff",
    boxShadow: "0 10px 26px rgba(0,0,0,0.75)",
    cursor: "pointer",
    transition: "transform 120ms ease, box-shadow 150ms ease, border-color 150ms ease, background 150ms ease",
    outline: "none",
  },
  btnSheen: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.10), transparent 55%)",
  },
  btnInnerRing: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
  },
  btnLabel: {
    position: "relative",
  },
};
