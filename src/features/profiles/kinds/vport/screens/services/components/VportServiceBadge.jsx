// src/features/profiles/kinds/vport/screens/services/components/VportServiceBadge.jsx
import React, { useMemo } from "react";

function formatMeta(meta) {
  if (meta == null) return "";
  if (typeof meta === "string") return meta.trim();
  if (typeof meta === "number") return String(meta);
  if (typeof meta === "boolean") return meta ? "Yes" : "No";

  // objects: show small summary if obvious keys exist
  if (typeof meta === "object") {
    const v =
      meta.value ??
      meta.note ??
      meta.notes ??
      meta.detail ??
      meta.details ??
      meta.hours ??
      null;
    if (typeof v === "string") return v.trim();
  }

  return "";
}

export default function VportServiceBadge({ label, enabled = true, meta = null }) {
  const metaText = useMemo(() => formatMeta(meta), [meta]);

  return (
    <div
      className={[
        "rounded-2xl border px-3 py-2",
        enabled
          ? "border-sky-300/25 bg-sky-300/10"
          : "border-white/10 bg-slate-950/45 opacity-60",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100 truncate">
            {label}
          </div>
          {metaText ? (
            <div className="mt-0.5 text-xs text-slate-400 break-words">
              {metaText}
            </div>
          ) : null}
        </div>

        <div
          className={[
            "shrink-0 rounded-full px-2 py-1 text-[11px] font-bold border",
            enabled
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-white/40",
          ].join(" ")}
        >
          {enabled ? "Available" : "Unavailable"}
        </div>
      </div>
    </div>
  );
}
