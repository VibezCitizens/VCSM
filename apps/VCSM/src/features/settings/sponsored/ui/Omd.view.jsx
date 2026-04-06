// src/features/settings/sponsored/ui/Omd.view.jsx
// ============================================================
// SETTINGS — SPONSORED
// One More Day (OMD)
// - Pure presentation
// - External link
// - No identity / actor coupling
// ============================================================

import React from "react";

const OMD_URL = "https://onemoredays.com";

export default function OmdView() {
  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* ================= HEADER ================= */}
      <div>
        <h2 className="text-lg font-semibold text-white">One More Day</h2>
        <p className="text-sm text-neutral-400">
          Powered by Vibez Citizens
        </p>
      </div>

      {/* ================= IMAGE CARD ================= */}
      <a
        href={OMD_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open onemoredays.com"
        className="
          block rounded-2xl overflow-hidden
          border border-neutral-800
          bg-neutral-950
          shadow-xl
          transition
          hover:ring-1 hover:ring-white/10
        "
      >
        <img
          src="/vgrid-preview.jpg"
          alt="One More Day preview"
          className="
            w-full h-auto object-cover
            transition group-hover:opacity-95
          "
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/avatar.jpg";
          }}
        />
      </a>

      {/* ================= CTA ================= */}
      <div>
        <a
          href={OMD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-2
            px-4 py-2 rounded-xl
            bg-gradient-to-r from-purple-600 to-fuchsia-600
            text-white text-sm font-medium
            hover:opacity-90 transition
          "
        >
          Visit onemoredays.com
        </a>
      </div>
    </div>
  );
}
