// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItemForm.styles.js

export const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  background: "rgba(0,0,0,0.65)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

export const cardStyle = {
  width: "100%",
  maxWidth: 680,
  borderRadius: 18,
  overflow: "hidden",
  background: "rgba(17, 17, 17, 0.92)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
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

export const sectionPad = { padding: 16 };

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
