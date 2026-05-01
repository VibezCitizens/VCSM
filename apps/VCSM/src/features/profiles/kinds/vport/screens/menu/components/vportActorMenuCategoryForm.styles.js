export const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 100000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  background: "rgba(3, 8, 20, 0.84)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  pointerEvents: "auto",
};

export const cardStyle = {
  width: "100%",
  maxWidth: 560,
  maxHeight: "calc(100vh - 32px)",
  borderRadius: 18,
  background:
    "linear-gradient(180deg, rgba(10, 16, 34, 0.98) 0%, rgba(7, 11, 25, 0.99) 100%)",
  border: "1px solid rgba(147, 197, 253, 0.28)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
  overflow: "hidden",
  color: "#fff",
  display: "flex",
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

export const titleStyle = { fontSize: 16, fontWeight: 800, letterSpacing: 0.2 };

export const labelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "rgba(255,255,255,0.92)",
};

export const helperStyle = {
  fontSize: 12,
  color: "rgba(255,255,255,0.55)",
  lineHeight: "16px",
};

export const fieldBase = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "rgba(8,13,30,0.96)",
  color: "#fff",
  outline: "none",
};

export function getButtonBase(saving) {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: 700,
    cursor: saving ? "not-allowed" : "pointer",
    opacity: saving ? 0.6 : 1,
    whiteSpace: "nowrap",
  };
}

export function getPrimaryButton(saving) {
  return {
    ...getButtonBase(saving),
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.16)",
  };
}
