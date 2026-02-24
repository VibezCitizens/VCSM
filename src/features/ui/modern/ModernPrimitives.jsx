import React from "react";

export function ModernPage({ children, style = {} }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
        color: "#fff",
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ModernContainer({ children, isDesktop = false, style = {} }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: isDesktop ? 1280 : 900,
        margin: "0 auto",
        paddingBottom: 56,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ModernShell({ children, style = {} }) {
  return (
    <div
      style={{
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(180deg, rgba(18,22,36,0.88), rgba(10,12,22,0.82))",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ModernTopBar({ left, title, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: 14,
      }}
    >
      <div>{left}</div>
      <div style={{ fontWeight: 950, letterSpacing: 1.2 }}>{title}</div>
      <div>{right ?? <div style={{ width: 110 }} />}</div>
    </div>
  );
}

export function ModernButton({ children, onClick, variant = "soft", style = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
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
        ...style,
      }}
    >
      {children}
    </button>
  );
}

