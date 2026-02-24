export const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  background: "rgba(0,0,0,0.35)",
};

export const MODAL_STYLE = {
  width: "100%",
  maxWidth: 520,
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  overflow: "hidden",
};

export const HEADER_STYLE = {
  padding: "14px 16px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

export const CLOSE_BTN_STYLE = {
  padding: "6px 10px",
  borderRadius: 10,
};

export const BODY_STYLE = { padding: 16 };
export const DESCRIPTION_STYLE = {
  fontSize: 13,
  color: "#374151",
  lineHeight: "18px",
};

export const ERROR_STYLE = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  fontSize: 12,
  lineHeight: "16px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

export const ACTIONS_STYLE = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  paddingTop: 16,
};

export const CANCEL_BTN_STYLE = { padding: "8px 12px", borderRadius: 12 };

export function createConfirmBtnStyle(danger) {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: danger ? "1px solid #fecaca" : "1px solid #e5e7eb",
    background: danger ? "#fef2f2" : "#fff",
  };
}

