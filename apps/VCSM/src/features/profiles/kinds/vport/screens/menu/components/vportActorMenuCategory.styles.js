export const card = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 14,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

export const pill = {
  fontSize: 12,
  padding: "3px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.85)",
  whiteSpace: "nowrap",
};

export const codePill = {
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 12,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.25)",
  color: "rgba(255,255,255,0.82)",
};

export const inputStyle = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.35)",
  color: "#fff",
  outline: "none",
};

export const inlineCreateWrap = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.28)",
};

export const emptyBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  border: "1px dashed rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.25)",
  color: "rgba(255,255,255,0.70)",
  fontSize: 13,
};

export const itemRow = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(0,0,0,0.22)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

export const thumbWrap = {
  width: 54,
  height: 54,
  borderRadius: 12,
  overflow: "hidden",
  flexShrink: 0,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.35)",
};

export function getBtn(canInteract) {
  return {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: canInteract ? "pointer" : "not-allowed",
    opacity: canInteract ? 1 : 0.6,
    whiteSpace: "nowrap",
  };
}

export function getBtnDanger(canInteract) {
  return {
    ...getBtn(canInteract),
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.10)",
  };
}
