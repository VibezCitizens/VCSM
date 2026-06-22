export function getPosterFlyerAccentStyles(safeAccent) {
  return {
    rightCol: {
      background: safeAccent,
      padding: 22,
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    },
    bigHeadline: {
      fontSize: 52,
      lineHeight: 0.95,
      fontWeight: 950,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: safeAccent,
    },
  };
}

export function miniImg(url) {
  return {
    height: 120,
    background: url ? `url(${url})` : "rgba(0,0,0,0.12)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export const posterPage = {
  minHeight: "100vh",
  width: "100%",
  background: "#f3f3f3",
  padding: 18,
  display: "flex",
  justifyContent: "center",
  overflowY: "auto",
};

export const posterSheet = {
  width: "100%",
  maxWidth: 920,
  background: "#fff",
  borderRadius: 18,
  overflow: "hidden",
  boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
  border: "1px solid rgba(0,0,0,0.08)",
};

export const posterInner = {
  display: "grid",
  gridTemplateColumns: "1fr 320px",
  minHeight: 720,
};

export const leftCol = {
  padding: 26,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

export const hero = {
  height: 150,
  borderRadius: 16,
  overflow: "hidden",
  position: "relative",
  background:
    "radial-gradient(900px 340px at 18% 20%, rgba(0,255,240,0.18), transparent 60%), radial-gradient(900px 340px at 82% 30%, rgba(124,58,237,0.16), transparent 62%), radial-gradient(700px 340px at 55% 90%, rgba(0,153,255,0.12), transparent 60%), linear-gradient(180deg, rgba(10,12,22,0.22), rgba(5,6,11,0.10))",
  border: "1px solid rgba(0,0,0,0.06)",
};

export const heroOverlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.35) 100%)",
};

export const smallTop = {
  fontSize: 11,
  letterSpacing: 1.6,
  textTransform: "uppercase",
  color: "rgba(0,0,0,0.55)",
  fontWeight: 900,
};

export const qrBox = {
  borderRadius: 14,
  border: "2px solid rgba(0,0,0,0.08)",
  padding: 16,
  display: "grid",
  placeItems: "center",
  width: "fit-content",
  background: "#fff",
};

export const qrLabel = {
  marginTop: 10,
  fontSize: 12,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  fontWeight: 950,
  color: "rgba(0,0,0,0.6)",
  textAlign: "center",
};

export const ctaTitle = {
  fontSize: 26,
  fontWeight: 950,
  letterSpacing: 0.8,
  textTransform: "uppercase",
};

export const ctaText = {
  fontSize: 13,
  lineHeight: 1.4,
  color: "rgba(255,255,255,0.9)",
};

export const miniCard = {
  borderRadius: 14,
  overflow: "hidden",
  background: "rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.22)",
};

export const footerBar = {
  marginTop: "auto",
  paddingTop: 14,
  borderTop: "1px solid rgba(255,255,255,0.25)",
  display: "grid",
  gap: 8,
  fontSize: 12,
  letterSpacing: 0.2,
};

export const chip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.08)",
  fontSize: 12,
  color: "rgba(0,0,0,0.7)",
  fontWeight: 800,
  width: "fit-content",
};

export const printBtn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.45)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 950,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
