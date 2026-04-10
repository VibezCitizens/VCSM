export function createVportDashboardShellStyles({ isDesktop, maxWidthDesktop = 1280 }) {
  return {
    page: {
      minHeight: "100vh",
      width: "100%",
      background:
        "radial-gradient(900px 500px at 15% 10%, var(--vc-gradient-a, rgba(108,77,246,0.15)), transparent 60%), " +
        "radial-gradient(800px 420px at 85% 90%, var(--vc-gradient-b, rgba(59,130,246,0.10)), transparent 60%), " +
        "var(--vc-bg-0, #0b0b0f)",
      color: "#fff",
      padding: isDesktop ? 18 : 12,
    },
    container: {
      width: "100%",
      maxWidth: isDesktop ? maxWidthDesktop : 900,
      margin: "0 auto",
      paddingBottom: 56,
    },
    headerWrap: {
      borderRadius: 20,
      overflow: "hidden",
      border: "1px solid var(--vc-border, rgba(139,92,246,0.18))",
      background: "var(--vc-card-bg, linear-gradient(180deg, rgba(20,20,26,0.98), rgba(20,20,26,0.90)))",
      boxShadow: "var(--vc-shadow-elevated, 0 24px 45px rgba(0,0,0,0.36))",
    },
    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: isDesktop ? "14px 16px" : "10px 14px",
      minHeight: isDesktop ? 56 : 48,
    },
    title: {
      fontWeight: 700,
      letterSpacing: 1.2,
      fontSize: isDesktop ? 15 : 13,
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.7)",
    },
    rightSpacer: { width: isDesktop ? 80 : 36, height: 1 },
  };
}
