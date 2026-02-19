// src/features/profiles/kinds/vport/screens/views/tabs/review/styles/reviewStyles.js

// ✅ keep pill for any components still using it (ServicesPicker, etc.)
export const pill = (active) => ({
  borderRadius: 999,
  padding: "10px 12px",
  border: active
    ? "1px solid rgba(255,255,255,0.16)"
    : "1px solid rgba(255,255,255,0.08)",
  background: active
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.03)",
  color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)",
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: 0.6,
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
});

// ✅ segmented control wrapper
export const segWrap = () => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: 6,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
});

// ✅ segmented control button
export const segBtn = (active) => ({
  borderRadius: 999,
  padding: "9px 12px",
  border: "1px solid transparent",
  background: active
    ? "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))"
    : "transparent",
  color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.62)",
  fontWeight: 950,
  fontSize: 12,
  letterSpacing: 0.35,
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
  boxShadow: active ? "0 8px 18px rgba(0,0,0,0.28)" : "none",
  transition: "background 140ms ease, color 140ms ease, box-shadow 140ms ease",
});

export const chip = () => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 999,
  padding: "6px 10px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 850,
  fontSize: 12,
  letterSpacing: 0.3,
  whiteSpace: "nowrap",
});

export const starBtn = (on) => ({
  width: 36,
  height: 36,
  borderRadius: 12,
  border: on
    ? "1px solid rgba(255,255,255,0.18)"
    : "1px solid rgba(255,255,255,0.08)",
  background: on ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
  color: on ? "#fff" : "rgba(255,255,255,0.60)",
  fontWeight: 950,
  cursor: "pointer",
  transition: "transform 120ms ease, background 120ms ease, border-color 120ms ease",
});
