// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersHome.screen.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import { resolveRealm } from "@/features/upload/model/resolveRealm";

import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";

export default function WandersHomeScreen() {
  const navigate = useNavigate();

  // ✅ New architecture: guest auth identity (auth.users.id)
  const { ensureUser } = useWandersGuest();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publicInboxIdOrUrl, setPublicInboxIdOrUrl] = useState("");

  const baseUrl = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {}
    return "";
  }, []);

  const realmId = resolveRealm(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.resolve(ensureUser?.());
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureUser]);

  const parsedPublicInboxId = useMemo(() => {
    const raw = (publicInboxIdOrUrl || "").trim();
    if (!raw) return "";

    try {
      const maybeUrl = raw.startsWith("http://") || raw.startsWith("https://") ? new URL(raw) : null;
      const path = maybeUrl ? maybeUrl.pathname : raw;
      const match = path.match(/\/wanders\/i\/([^/?#]+)/i);
      if (match?.[1]) return match[1];
    } catch {}

    const loose = raw.match(/(?:^|\/)i\/([^/?#]+)/i);
    if (loose?.[1]) return loose[1];

    return raw;
  }, [publicInboxIdOrUrl]);

  const goMailbox = () => navigate("/wanders/mailbox");
  const goCreate = () =>
    navigate("/wanders/create", {
      state: { realmId, baseUrl },
    });

  const goPublicInbox = () => {
    const id = parsedPublicInboxId;
    if (!id) return;
    navigate(`/wanders/i/${id}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") goPublicInbox();
  };

  if (loading) return <WandersLoading />;

  if (error) {
    return <WandersEmptyState title="Wanders unavailable" subtitle={String(error?.message || error)} />;
  }

  // ✅ Sent theme tokens (same vibe, but inline so it works without Tailwind)
  const shellStyle = {
    position: "relative",
    minHeight: "100dvh",
    width: "100%",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    background: "#000",
    color: "#fff",
  };

  const bgGlowStyle = {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background: "radial-gradient(600px 200px at 50% -80px, rgba(168,85,247,0.15), transparent)",
  };

  const headerStyle = {
    position: "sticky",
    top: 0,
    zIndex: 20,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.70)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  };

  const containerStyle = {
    width: "100%",
    maxWidth: 896,
    margin: "0 auto",
    padding: "0 16px",
    boxSizing: "border-box",
  };

  const headerPad = { padding: "16px 0" };

  const dashBoxStyle = {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 36px rgba(124,58,237,0.10)",
    padding: 16,
    boxSizing: "border-box",
  };

  const glowTLStyle = {
    pointerEvents: "none",
    position: "absolute",
    top: -64,
    left: -64,
    width: 224,
    height: 224,
    borderRadius: 9999,
    background: "rgba(139,92,246,0.10)",
    filter: "blur(48px)",
  };

  const glowBRStyle = {
    pointerEvents: "none",
    position: "absolute",
    right: -80,
    bottom: -80,
    width: 288,
    height: 288,
    borderRadius: 9999,
    background: "rgba(217,70,239,0.08)",
    filter: "blur(56px)",
  };

  const btnLiftStyle = {
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    background: "rgba(24,24,27,0.90)",
    border: "1px solid rgba(255,255,255,0.15)",
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 800,
    color: "#fff",
    boxShadow: "0 10px 26px rgba(0,0,0,0.75)",
    cursor: "pointer",
    transition: "transform 120ms ease, box-shadow 150ms ease, border-color 150ms ease, background 150ms ease",
    outline: "none",
    width: "100%",
  };

  const btnSheenStyle = {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.10), transparent 55%)",
  };

  const btnInnerRingStyle = {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
  };

  const btnLabelStyle = { position: "relative" };

  const inputStyle = {
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.35)",
    color: "rgba(255,255,255,0.92)",
    padding: "12px 12px",
    boxSizing: "border-box",
    fontSize: 14,
    outline: "none",
  };

  const mainStyle = {
    position: "relative",
    width: "100%",
    maxWidth: 896,
    margin: "0 auto",
    padding: "24px 16px 112px",
    boxSizing: "border-box",
  };

  const gridStyle = {
    display: "grid",
    gap: 14,
  };

  const rowBetween = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const pillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 9999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    padding: "6px 10px",
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
  };

  const muted = { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 6, lineHeight: 1.35 };
  const title = { fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.92)" };

  return (
    <div style={shellStyle}>
      <div aria-hidden style={bgGlowStyle} />

      <header style={headerStyle}>
        <div style={containerStyle}>
          <div style={headerPad}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.02em" }}>Wanders</div>
                <div style={{ marginTop: 4, fontSize: 13, color: "rgba(228,228,231,0.85)" }}>
                  Simple cards and anonymous replies — fast, private, and clean.
                </div>
              </div>

              <div style={{ display: "none" }} className="wanders-home-pill-hidden-sm">
                {/* keep your old text, but we won't rely on Tailwind */}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={mainStyle}>
        <div style={gridStyle}>
          {/* HERO / PRIMARY CTA */}
          <div style={dashBoxStyle}>
            <div aria-hidden style={glowTLStyle} />
            <div aria-hidden style={glowBRStyle} />
            <div style={{ position: "relative" }}>
              <div style={rowBetween}>
                <div>
                  <div style={title}>Start</div>
                  <div style={muted}>Create a card in seconds or open your mailbox.</div>
                </div>

                <div style={pillStyle}>💌</div>
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <button type="button" onClick={goCreate} style={btnLiftStyle}>
                  <span aria-hidden style={btnSheenStyle} />
                  <span aria-hidden style={btnInnerRingStyle} />
                  <span style={btnLabelStyle}>Create a card</span>
                </button>

                <button type="button" onClick={goMailbox} style={btnLiftStyle}>
                  <span aria-hidden style={btnSheenStyle} />
                  <span aria-hidden style={btnInnerRingStyle} />
                  <span style={btnLabelStyle}>Open mailbox</span>
                </button>
              </div>

              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={pillStyle}>🔒 Guest-safe</span>
                <span style={pillStyle}>🕊️ Anonymous-friendly</span>
                <span style={pillStyle}>⚡ Mobile-first</span>
              </div>
            </div>
          </div>

          {/* OPEN PUBLIC INBOX */}
          <div style={dashBoxStyle}>
            <div aria-hidden style={glowTLStyle} />
            <div aria-hidden style={glowBRStyle} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={title}>Open an inbox</div>
                  <div style={muted}>Paste an inbox link or just the id.</div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Shareable</div>
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <input
                  value={publicInboxIdOrUrl}
                  onChange={(e) => setPublicInboxIdOrUrl(e.target.value)}
                  placeholder="Paste /wanders/i/:publicId or just :publicId"
                  onKeyDown={onKeyDown}
                  style={inputStyle}
                />

                <button type="button" onClick={goPublicInbox} style={btnLiftStyle}>
                  <span aria-hidden style={btnSheenStyle} />
                  <span aria-hidden style={btnInnerRingStyle} />
                  <span style={btnLabelStyle}>Open inbox</span>
                </button>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                Example: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", color: "rgba(255,255,255,0.70)" }}>/wanders/i/abc123</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            Tip: After you create a card, you’ll see the dashboard on the “sent” screen.
          </div>
        </div>
      </main>
    </div>
  );
}
