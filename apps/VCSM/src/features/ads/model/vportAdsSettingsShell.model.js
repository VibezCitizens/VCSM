export function createVportAdsSettingsShellStyles({
  isDesktop,
  maxWidthDesktop = 1100,
}) {
  return {
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
    maxWidthDesktop,
    isDesktop,
  };
}
