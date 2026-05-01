const cardStyles = {

  card: {
    borderRadius: 28,
    border: "1px solid rgba(124,92,255,0.20)",
    background: "linear-gradient(160deg, rgba(26,20,48,0.99) 0%, rgba(14,12,24,0.98) 100%)",
    boxShadow:
      "0 0 0 1px rgba(124,92,255,0.07) inset, " +
      "0 36px 80px rgba(0,0,0,0.70), " +
      "0 0 100px rgba(124,92,255,0.09)",
    overflow: "hidden",
  },

  cardBand: {
    height: 88,
    background: "linear-gradient(135deg, #3b0764 0%, #5b21b6 52%, #7c5cff 100%)",
  },

  cardBody: {
    padding: "0 24px 28px",
  },

  logoWrap: {
    marginTop: -48,
    marginBottom: 18,
    display: "flex",
    justifyContent: "center",
  },

  logo: {
    width: 92,
    height: 92,
    borderRadius: 18,
    objectFit: "cover",
    border: "3px solid rgba(124,92,255,0.55)",
    background: "rgba(18,14,32,0.96)",
    boxShadow:
      "0 12px 32px rgba(0,0,0,0.72), " +
      "0 0 0 5px rgba(124,92,255,0.08), " +
      "0 0 44px rgba(124,92,255,0.14)",
    flexShrink: 0,
    display: "block",
  },

  identity: {
    textAlign: "center",
    marginBottom: 4,
  },

  businessName: {
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1.15,
    letterSpacing: "-0.5px",
    color: "#ffffff",
    wordBreak: "break-word",
  },

  handle: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.4px",
    color: "rgba(255,255,255,0.38)",
  },

  categoryBadgeRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: 10,
  },

  categoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 11px",
    borderRadius: 99,
    background: "rgba(124,92,255,0.14)",
    border: "1px solid rgba(124,92,255,0.28)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.6px",
    textTransform: "uppercase",
    color: "#c4b5fd",
  },

  reviewRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },

  reviewScore: {
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
  },

  reviewStars: {
    display: "flex",
    gap: 1,
    fontSize: 12,
  },

  reviewCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.40)",
  },

  description: {
    margin: "14px 0 0",
    fontSize: 13,
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.58)",
    textAlign: "center",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },

  separator: {
    margin: "20px 0",
    height: 1,
    background: "rgba(255,255,255,0.07)",
  },

  contactList: {
    display: "flex",
    flexDirection: "column",
    gap: 11,
  },

  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    fontSize: 13.5,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.45,
    minHeight: 32,
  },

  contactIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    background: "rgba(124,92,255,0.12)",
    border: "1px solid rgba(124,92,255,0.18)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#a78bfa",
  },

  contactText: {
    flex: 1,
    wordBreak: "break-word",
  },

  contactLink: {
    flex: 1,
    color: "#a78bfa",
    textDecoration: "none",
    wordBreak: "break-all",
  },

  ctaRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },

  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 99,
    padding: "10px 8px",
    border: "1px solid rgba(255,255,255,0.13)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.85)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.1px",
    cursor: "pointer",
    minHeight: 40,
    boxSizing: "border-box",
  },

  primaryCta: {
    marginTop: 12,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    border: "1px solid rgba(124,92,255,0.40)",
    background: "linear-gradient(135deg, #5b21b6 0%, #7c5cff 100%)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.3px",
    padding: "15px 20px",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: "0 10px 30px rgba(124,92,255,0.38), 0 0 0 1px rgba(124,92,255,0.22) inset",
  },
};

export default cardStyles;
