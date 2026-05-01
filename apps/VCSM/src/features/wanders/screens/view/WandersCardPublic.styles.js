export const wandersCardPublicStyles = {
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderBottom: "1px solid var(--vc-border)",
    background: "rgba(0,0,0,0.22)",
  },

  panelTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--vc-text)",
    letterSpacing: 0.2,
  },

  panelMeta: {
    fontSize: 12,
    fontWeight: 800,
    color: "var(--vc-text-soft)",
  },

  panelBody: {
    position: "relative",
    padding: 12,
    boxSizing: "border-box",
  },

  divider: {
    height: 1,
    background: "var(--vc-border)",
    marginTop: 12,
    marginBottom: 12,
  },

  error: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 800,
    color: "var(--vc-error)",
  },

  mutedSmall: {
    fontSize: 12,
    fontWeight: 800,
    color: "var(--vc-text-soft)",
    opacity: 0.9,
  },

  ctaWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  ctaMeta: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.55,
    textTransform: "uppercase",
    color: "var(--vc-text-muted)",
  },

  ctaBtn: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,105,198,0.42)",
    background: "linear-gradient(135deg, rgba(139,92,246,0.38), rgba(255,105,198,0.38))",
    color: "var(--vc-text)",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 10px 24px rgba(0,0,0,0.45), 0 0 28px rgba(255,105,198,0.18)",
    transition: "transform 120ms ease, box-shadow 180ms ease, opacity 120ms ease",
  },

  ctaBtnBusy: {
    opacity: 0.85,
    cursor: "wait",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 4,
    opacity: 0.95,
  },

  footerBtn: {
    position: "relative",
    overflow: "hidden",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--vc-border)",
    background: "var(--vc-surface)",
    color: "var(--vc-text)",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 8px 20px rgba(0,0,0,0.55)",
    transition: "transform 120ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
  },

  btnSheenSoft: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent 60%)",
  },

  btnInnerRingSoft: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
  },

  btnText: {
    position: "relative",
    zIndex: 1,
  },

  showLoveBtn: {
    position: "relative",
    overflow: "hidden",
    padding: "12px 18px",
    borderRadius: 12,
    border: "0px solid transparent",
    background: "linear-gradient(135deg, #ec4899, #ef4444)",
    color: "#fff",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 10px 30px rgba(239,68,68,0.35), 0 0 40px rgba(236,72,153,0.25)",
    transition: "transform 120ms ease, box-shadow 180ms ease",
  },

  showLoveSheen: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent 55%)",
  },

  showLoveInnerRing: {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
  },

  showLoveText: {
    position: "relative",
    zIndex: 1,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  brand: {
    fontSize: 13,
    fontWeight: 800,
    color: "var(--vc-text-soft)",
    opacity: 0.9,
  },

  muted: {
    fontSize: 13,
    opacity: 0.55,
    color: "var(--vc-text-soft)",
  },
};
