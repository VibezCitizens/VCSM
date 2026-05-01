export const styles = {
  toolbar: {
    position: "relative",
  },

  split: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
    alignItems: "start",
  },

  detailWrap: {
    position: "relative",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxSizing: "border-box",
  },

  subPanel: {
    borderRadius: 14,
    border: "1px solid var(--vc-border)",
    background: "rgba(0,0,0,0.30)",
    padding: 10,
    boxSizing: "border-box",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
    color: "var(--vc-text-soft)",
  },

  loadingText: {
    padding: "24px 0",
    textAlign: "center",
    fontSize: 14,
    color: "var(--vc-text-muted)",
  },

  replyError: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "var(--vc-error)",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    background: "rgba(0,0,0,0.70)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },

  modalCard: {
    width: "min(720px, 100%)",
    borderRadius: 18,
    border: "1px solid var(--vc-border)",
    background: "var(--vc-surface-strong)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.72), 0 0 42px rgba(139,92,246,0.16)",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "12px 14px",
    borderBottom: "1px solid var(--vc-border)",
  },

  modalTitle: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: "0.02em",
    color: "var(--vc-text)",
  },

  modalCloseBtn: {
    appearance: "none",
    border: "1px solid var(--vc-border)",
    background: "var(--vc-surface)",
    color: "var(--vc-text-soft)",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 900,
    lineHeight: 1,
  },

  modalBody: {
    padding: 14,
  },

  modalText: {
    fontSize: 13,
    lineHeight: 1.55,
    color: "var(--vc-text-soft)",
  },

  modalActionsRow: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "var(--vc-text-muted)",
    userSelect: "none",
  },

  checkboxLabel: {
    lineHeight: 1.3,
  },

  modalBtns: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  modalBtnGhost: {
    borderRadius: 12,
    border: "1px solid var(--vc-border)",
    background: "var(--vc-surface)",
    color: "var(--vc-text)",
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
  },

  modalHint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 1.45,
    color: "var(--vc-text-muted)",
  },
};
