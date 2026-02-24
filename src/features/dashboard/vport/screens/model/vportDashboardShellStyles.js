export function createVportDashboardShellStyles({ isDesktop, maxWidthDesktop = 1280 }) {
  const title = {
    fontWeight: 950,
    letterSpacing: 1.6,
    fontSize: isDesktop ? 17 : 15,
    textTransform: "uppercase",
  };

  const rightSpacer = { width: 118, height: 1 };

  return {
    page: {
      minHeight: "100vh",
      width: "100%",
      background:
        "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
      color: "#fff",
      padding: 18,
    },
    container: {
      width: "100%",
      maxWidth: isDesktop ? maxWidthDesktop : 900,
      margin: "0 auto",
      paddingBottom: 56,
    },
    headerWrap: {
      borderRadius: 24,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(12,14,24,0.55)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
    },
    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "14px 16px",
      minHeight: 72,
    },
    btn: (variant = "soft") => ({
      padding: "10px 16px",
      minHeight: 48,
      borderRadius: 20,
      border:
        variant === "soft"
          ? "1px solid rgba(255,255,255,0.16)"
          : "1px solid rgba(0,255,240,0.3)",
      background:
        variant === "soft"
          ? "linear-gradient(135deg, rgba(38,46,66,0.82), rgba(23,30,46,0.78))"
          : "linear-gradient(135deg, rgba(0,173,222,0.28), rgba(80,66,198,0.24), rgba(0,122,255,0.24))",
      color: "#fff",
      fontSize: 14,
      fontWeight: 900,
      cursor: "pointer",
      whiteSpace: "nowrap",
      letterSpacing: 0.2,
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 40px rgba(0,0,0,0.35)",
    }),
    title,
    rightSpacer,
  };
}
