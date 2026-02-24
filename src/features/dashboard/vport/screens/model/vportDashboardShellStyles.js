export function createVportDashboardShellStyles({ isDesktop, maxWidthDesktop = 1280 }) {
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
      padding: 14,
    },
    btn: (variant = "soft") => ({
      padding: "10px 12px",
      borderRadius: 14,
      border:
        variant === "soft"
          ? "1px solid rgba(255,255,255,0.12)"
          : "1px solid rgba(0,255,240,0.22)",
      background:
        variant === "soft"
          ? "rgba(255,255,255,0.06)"
          : "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
      color: "#fff",
      fontSize: 13,
      fontWeight: 900,
      cursor: "pointer",
      whiteSpace: "nowrap",
      letterSpacing: 0.3,
    }),
  };
}
