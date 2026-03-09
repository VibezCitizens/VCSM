// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItemForm.styles.js

export const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 100000,

  // ✅ iOS: make overlay the scroll container
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",

  // ✅ top-align instead of vertical center
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",

  padding: 16,
  background: "rgba(3, 8, 20, 0.84)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

export const cardStyle = {
  width: "100%",
  maxWidth: 680,
  maxHeight: "calc(100vh - 32px)", // ✅ prevents modal from exceeding viewport (overlay padding=16)
  borderRadius: 18,
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(10, 16, 34, 0.98) 0%, rgba(7, 11, 25, 0.99) 100%)",
  border: "1px solid rgba(147, 197, 253, 0.28)",
  boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
  display: "flex", // ✅ allows header + scroll body + sticky footer layout
  flexDirection: "column",
};

export const headerStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

export const titleStyle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#fff",
  letterSpacing: 0.2,
};

export const iconBtnBase = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.9)",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

export const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(255,255,255,0.78)",
  letterSpacing: 0.2,
};

export const helperStyle = {
  fontSize: 12,
  color: "rgba(255,255,255,0.50)",
  lineHeight: "16px",
};

export const fieldBase = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "rgba(8,13,30,0.96)",
  color: "#fff",
  outline: "none",
};

export const fieldBaseDisabled = {
  opacity: 0.6,
  cursor: "not-allowed",
};

export const row2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

export const sectionPad = {
  padding: 16,
  overflowY: "auto", // ✅ makes modal body scrollable on small screens
  WebkitOverflowScrolling: "touch", // ✅ iOS momentum scroll
  minHeight: 0, // ✅ critical when inside flex column
};

export const dangerBox = {
  padding: 12,
  borderRadius: 14,
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(239, 68, 68, 0.25)",
  color: "rgba(255,255,255,0.92)",
  fontSize: 13,
  lineHeight: "18px",
};

export const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  paddingTop: 6,
};

export const secondaryBtnBase = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
  fontSize: 13,
  fontWeight: 800,
};

export const primaryBtnBase = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(168, 85, 247, 0.35)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 900,
};

export const imageCard = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.20)",
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

export const imageRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

export const imagePreview = {
  width: 92,
  height: 92,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  color: "rgba(255,255,255,0.55)",
  fontSize: 12,
};

export const tinyBtnBase = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

export const tinyBtnDanger = {
  ...tinyBtnBase,
  border: "1px solid rgba(239,68,68,0.35)",
  background: "rgba(239,68,68,0.10)",
};

export const selectChevronStyle = {
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.55) 50%), linear-gradient(135deg, rgba(255,255,255,0.55) 50%, transparent 50%)",
  backgroundPosition:
    "calc(100% - 18px) calc(50% - 2px), calc(100% - 12px) calc(50% - 2px)",
  backgroundSize: "6px 6px, 6px 6px",
  backgroundRepeat: "no-repeat",
};
