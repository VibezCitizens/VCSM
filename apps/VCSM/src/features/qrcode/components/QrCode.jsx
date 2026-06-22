import React from "react";
import QRCode from "react-qr-code";

/**
 * Low-level QR renderer.
 * Use this when you only need the SVG QR itself.
 */
export function QrCode({
  value,
  size = 256,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  level = "M", // L | M | Q | H
  style,
  title,       // forwarded to SVG — improves screen-reader accessibility
  className,   // forwarded to SVG — allows caller CSS (e.g. print image-rendering rules)
}) {
  const v = typeof value === "string" ? value : value == null ? "" : String(value);

  if (!v.trim()) return null;

  return (
    <div style={{ width: size, height: size, ...style }}>
      <QRCode value={v} size={size} bgColor={bgColor} fgColor={fgColor} level={level} title={title} className={className} />
    </div>
  );
}

export default QrCode;
