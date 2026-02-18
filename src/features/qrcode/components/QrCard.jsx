import React, { useMemo } from "react";
import QrCode from "./QrCode";

/**
 * Higher-level wrapper with a "card" look (good for flyers, pages, modals).
 * You can reuse this across your app and keep styling consistent.
 */
export function QrCard({
  value,
  size = 240,
  label,
  footer,
  outerStyle,
  innerStyle,
  showGradientBorder = true,
}) {
  const v = typeof value === "string" ? value : value == null ? "" : String(value);

  const qrWrapOuter = useMemo(
    () => ({
      padding: 1,
      borderRadius: 22,
      background: showGradientBorder
        ? "linear-gradient(135deg, rgba(0,255,240,0.35), rgba(124,58,237,0.28), rgba(0,153,255,0.22))"
        : "#e6e6e6",
      boxShadow: "0 18px 44px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.02) inset",
      ...outerStyle,
    }),
    [outerStyle, showGradientBorder]
  );

  const qrWrapInner = useMemo(
    () => ({
      borderRadius: 21,
      background: "#ffffff",
      padding: 18,
      ...innerStyle,
    }),
    [innerStyle]
  );

  if (!v.trim()) return null;

  return (
    <div>
      {label ? (
        <div style={{ fontSize: 14, fontWeight: 950, letterSpacing: 1.2, marginBottom: 10 }}>
          {label}
        </div>
      ) : null}

      <div className="print-qrOuter" style={qrWrapOuter}>
        <div style={qrWrapInner}>
          <QrCode value={v} size={size} />
        </div>
      </div>

      {footer ? (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, textAlign: "center" }}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export default QrCard;
