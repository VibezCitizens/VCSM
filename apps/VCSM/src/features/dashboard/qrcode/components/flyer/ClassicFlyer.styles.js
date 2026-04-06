export const CLASSIC_FLYER_CSS = `
  @media (max-width: 640px) {
    .classic-sheet { border-radius: 22px !important; }
    .classic-hero { height: 170px !important; }
    .classic-header { margin-top: -28px !important; padding: 14px !important; gap: 12px !important; }
    .classic-avatar { width: 72px !important; height: 72px !important; border-radius: 18px !important; font-size: 14px !important; }
    .classic-title { font-size: 22px !important; }
    .classic-body { padding: 14px !important; padding-top: 6px !important; display: flex !important; flex-direction: column !important; gap: 12px !important; }
    .classic-left, .classic-right { min-width: 0 !important; width: 100% !important; }
    .classic-right { align-items: stretch !important; }
    .classic-qrInner { padding: 14px !important; }
    .classic-qrSvg { width: 220px !important; height: 220px !important; }
  }

  @media print {
    html, body { height: auto !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    .print-page { padding: 0 !important; background: #fff !important; }
    .print-sheet { box-shadow: none !important; border: 1px solid #ddd !important; background: #fff !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    .print-text { color: #000 !important; }
    .print-muted { color: rgba(0,0,0,0.65) !important; }
    .print-panel { border: 1px solid #e6e6e6 !important; background: #fff !important; }
    .print-qrOuter { box-shadow: none !important; background: #fff !important; border: 1px solid #e6e6e6 !important; }
    @page { margin: 10mm; }
  }
`;

export function buildClassicFlyerStyles(profile) {
  const bannerImage = profile.bannerUrl?.trim() ? `url(${profile.bannerUrl})` : null;
  const avatarImage = profile.avatarUrl?.trim() ? `url(${profile.avatarUrl})` : null;

  return {
    bannerImage,
    avatarImage,
    page: {
      minHeight: "100vh",
      width: "100%",
      background:
        "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), radial-gradient(900px 700px at 55% 85%, rgba(0,153,255,0.08), transparent 60%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
      color: "#fff",
      display: "flex",
      justifyContent: "center",
      padding: 18,
      overflowY: "auto",
    },
    sheet: {
      width: "100%",
      maxWidth: 820,
      borderRadius: 28,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(12,14,24,0.55)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
    },
    hero: {
      height: 240,
      position: "relative",
      backgroundColor: "#070812",
      backgroundImage: bannerImage
        ? bannerImage
        : "radial-gradient(900px 340px at 18% 20%, rgba(0,255,240,0.35), transparent 60%), radial-gradient(900px 340px at 82% 30%, rgba(124,58,237,0.30), transparent 62%), radial-gradient(700px 340px at 55% 90%, rgba(0,153,255,0.22), transparent 60%), linear-gradient(180deg, rgba(10,12,22,0.95), rgba(5,6,11,0.92))",
      backgroundSize: "cover",
      backgroundPosition: "center",
      filter: bannerImage ? "saturate(1.05) contrast(1.05)" : "none",
    },
    heroOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.92) 100%)",
    },
    header: {
      position: "relative",
      zIndex: 2,
      padding: 18,
      display: "flex",
      gap: 16,
      alignItems: "center",
      marginTop: -44,
    },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 24,
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
      fontSize: 18,
    },
    title: { fontSize: 28, fontWeight: 950, letterSpacing: 0.6, lineHeight: 1.05 },
    meta: { marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.62)", letterSpacing: 1.2 },
    tagline: { marginTop: 10, fontSize: 14, color: "rgba(255,255,255,0.62)", lineHeight: 1.35 },
    body: {
      padding: 18,
      paddingTop: 6,
      display: "flex",
      gap: 18,
      flexWrap: "wrap",
      alignItems: "stretch",
    },
    left: {
      flex: "1 1 360px",
      minWidth: 280,
      borderRadius: 22,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.03)",
      padding: 18,
    },
    right: {
      flex: "0 0 320px",
      minWidth: 280,
      borderRadius: 22,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.03)",
      padding: 18,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    },
    printRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 },
    printBtn: {
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      fontSize: 13,
      fontWeight: 900,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    hint: { fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.35 },
    qrWrapOuter: {
      padding: 1,
      borderRadius: 22,
      background:
        "linear-gradient(135deg, rgba(0,255,240,0.35), rgba(124,58,237,0.28), rgba(0,153,255,0.22))",
      boxShadow: "0 18px 44px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset",
    },
    qrWrapInner: { borderRadius: 21, background: "#ffffff", padding: 18 },
    urlBox: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
      color: "rgba(255,255,255,0.75)",
      fontSize: 12,
      wordBreak: "break-all",
      textAlign: "center",
    },
    smallRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },
  };
}

export function buildPill(enabled) {
  return {
    padding: "9px 12px",
    borderRadius: 999,
    border: enabled ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.08)",
    background: enabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
    color: enabled ? "#fff" : "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.3,
    cursor: enabled ? "pointer" : "not-allowed",
    userSelect: "none",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };
}
