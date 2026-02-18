// src/features/profiles/kinds/vport/screens/views/tabs/review/styles/reviewStyles.js

export const pill = (active) => ({
  borderRadius: 999,
  padding: "10px 12px",
  border: active ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(255,255,255,0.08)",
  background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
  color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)",
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: 0.6,
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
});

export const starBtn = (on) => ({
  width: 34,
  height: 34,
  borderRadius: 10,
  border: on ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(255,255,255,0.08)",
  background: on ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
  color: on ? "#fff" : "rgba(255,255,255,0.55)",
  fontWeight: 950,
  cursor: "pointer",
});
