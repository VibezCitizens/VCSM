"use client";

import { useState } from "react";
import { safeMediaSrc } from "@/lib/safeMediaSrc";

// Renders an <img> only when `src` passes the media scheme allowlist, and
// swaps to `fallback` on a load error so unsafe or broken provider media URLs
// never surface as a broken-image icon. Safe to embed inside server components
// (it is a client island). `fallback` is rendered for both the unsafe-URL and
// failed-load cases; default is nothing.
export function SafeImage({ src, alt = "", fallback = null, ...imgProps }) {
  const safeSrc = safeMediaSrc(src);
  const [failed, setFailed] = useState(false);

  if (!safeSrc || failed) return fallback;

  return (
    <img
      src={safeSrc}
      alt={alt}
      onError={() => setFailed(true)}
      {...imgProps}
    />
  );
}
