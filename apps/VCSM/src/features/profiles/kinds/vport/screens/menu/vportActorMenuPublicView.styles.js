export function getBtnBase(enabled) {
  return {
    borderRadius: 14,
    padding: "10px 12px",
    border: enabled ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.08)",
    background: enabled
      ? "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))"
      : "rgba(255,255,255,0.03)",
    color: enabled ? "#fff" : "rgba(255,255,255,0.45)",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 0.3,
    cursor: enabled ? "pointer" : "not-allowed",
    userSelect: "none",
    whiteSpace: "nowrap",
  };
}

export const headerWrap = {
  borderRadius: 24,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(12,14,24,0.55)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
};

export const actionRow = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

export const headerTopRow = {
  position: "relative",
  zIndex: 2,
  padding: 16,
  display: "flex",
  gap: 14,
  alignItems: "center",
  marginTop: -34,
  flexWrap: "wrap",
};

export const nameCol = {
  minWidth: 180,
  flex: 1,
};

export const actionsCol = {
  marginLeft: "auto",
  flexBasis: "100%",
  display: "flex",
  justifyContent: "flex-end",
};
