export function actionButtonStyle(enabled) {
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

export function tabStyle(active) {
  return {
    flex: 1,
    textAlign: "center",
    padding: "8px 0",
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    color: active ? "#fff" : "rgba(255,255,255,0.45)",
    cursor: "pointer",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid rgba(139,92,246,0.85)" : "2px solid transparent",
    transition: "color 0.15s",
    letterSpacing: 0.3,
  };
}

export const TABS = [
  { id: "menu", label: "Menu" },
  { id: "reviews", label: "Reviews" },
];
