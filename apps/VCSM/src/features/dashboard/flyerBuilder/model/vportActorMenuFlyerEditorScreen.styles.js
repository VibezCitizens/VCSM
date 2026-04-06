export function createFlyerEditorScreenStyles() {
  return {
    mobileOnlyPage: {
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 24,
      background:
        "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
      color: "#fff",
      textAlign: "center",
    },
    page: {
      height: "100dvh",
      width: "100%",
      overflow: "hidden",
      background:
        "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
      color: "#fff",
      padding: 14,
    },
    container: {
      width: "100%",
      maxWidth: 1180,
      margin: "0 auto",
      height: "100%",
      minHeight: 0,
      display: "grid",
      gridTemplateRows: "auto minmax(0,1fr)",
      gap: 12,
    },
    header: {
      borderRadius: 26,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.12)",
      background:
        "linear-gradient(180deg, rgba(18,22,36,0.88), rgba(10,12,22,0.82))",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      boxShadow: "0 30px 90px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)",
      padding: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    btn: (variant = "soft") => ({
      padding: "10px 13px",
      borderRadius: 14,
      border:
        variant === "soft"
          ? "1px solid rgba(255,255,255,0.14)"
          : "1px solid rgba(0,255,240,0.24)",
      background:
        variant === "soft"
          ? "rgba(255,255,255,0.07)"
          : "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
      color: "#fff",
      fontSize: 13,
      fontWeight: 900,
      cursor: "pointer",
      whiteSpace: "nowrap",
      letterSpacing: 0.4,
    }),
  };
}
