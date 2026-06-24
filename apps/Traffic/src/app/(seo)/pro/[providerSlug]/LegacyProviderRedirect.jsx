"use client";

import { useEffect } from "react";

// Static-export-safe replacement for redirect(): forwards human visitors of the
// legacy /pro/<slug> URL to the canonical /<country>/pro/<slug> page. Crawlers do
// not run this effect — they are handled by the page's rel=canonical + noindex.
export default function LegacyProviderRedirect({ target }) {
  useEffect(() => {
    if (target) {
      window.location.replace(target);
    }
  }, [target]);

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <p>Redirecting…</p>
      <a href={target}>Continue to this provider</a>
    </main>
  );
}
