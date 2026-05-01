const formStyles = {

  // ── Page layout ──────────────────────────────────────────────────────────────

  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(ellipse 900px 560px at 18% 8%, rgba(124,92,255,0.18), transparent 62%), " +
      "radial-gradient(ellipse 640px 400px at 84% 88%, rgba(59,130,246,0.10), transparent 56%), " +
      "#09080f",
    color: "#fff",
    padding: "28px 16px 72px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  // ── Disabled ghost button (unused variant) ────────────────────────────────────

  ghostBtnOff: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 99,
    padding: "10px 8px",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "transparent",
    color: "rgba(255,255,255,0.20)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "not-allowed",
    minHeight: 40,
    boxSizing: "border-box",
  },

  // ── Lead form ────────────────────────────────────────────────────────────────

  formCard: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15,12,24,0.96)",
    boxShadow: "0 20px 48px rgba(0,0,0,0.48)",
    padding: "22px 22px 28px",
  },

  formTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "0.1px",
    color: "rgba(255,255,255,0.90)",
  },

  formSubtitle: {
    margin: "5px 0 0",
    fontSize: 12,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.40)",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginTop: 14,
  },

  label: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.46)",
  },

  input: {
    width: "100%",
    borderRadius: 11,
    border: "1px solid rgba(255,255,255,0.11)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  },

  textarea: {
    minHeight: 100,
    resize: "vertical",
    lineHeight: 1.5,
  },

  errorText: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(252,165,165,0.96)",
  },

  formError: {
    marginTop: 10,
    borderRadius: 10,
    padding: "8px 10px",
    border: "1px solid rgba(251,113,133,0.36)",
    background: "rgba(127,29,29,0.22)",
    color: "#ffd6de",
    fontSize: 12,
    fontWeight: 700,
  },

  successText: {
    marginTop: 10,
    borderRadius: 10,
    padding: "8px 10px",
    border: "1px solid rgba(110,231,183,0.34)",
    background: "rgba(6,78,59,0.32)",
    color: "#d1fae5",
    fontSize: 12,
    fontWeight: 700,
  },

  submitBtn: {
    marginTop: 14,
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(124,92,255,0.40)",
    background: "linear-gradient(135deg, #5b21b6 0%, #7c5cff 100%)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: "0.2px",
    padding: "12px 16px",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: "0 6px 20px rgba(124,92,255,0.30)",
  },

  // ── Unavailable state ─────────────────────────────────────────────────────────

  unavailableBox: {
    borderRadius: 28,
    border: "1px solid rgba(124,92,255,0.18)",
    background: "linear-gradient(160deg, rgba(26,20,48,0.99), rgba(14,12,24,0.98))",
    boxShadow: "0 24px 56px rgba(0,0,0,0.55)",
    padding: 32,
    minHeight: 240,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    gap: 10,
  },

  unavailableTitle: {
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: "-0.3px",
    color: "#fff",
  },

  unavailableSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.50)",
    maxWidth: 360,
    lineHeight: 1.6,
  },
};

export default formStyles;
