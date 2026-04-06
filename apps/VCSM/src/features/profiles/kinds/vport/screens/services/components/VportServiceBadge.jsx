// src/features/profiles/kinds/vport/screens/services/components/VportServiceBadge.jsx
import React, { useMemo } from "react";

function formatMeta(meta) {
  if (meta == null) return "";
  if (typeof meta === "string") return meta.trim();
  if (typeof meta === "number") return String(meta);
  if (typeof meta === "boolean") return meta ? "Yes" : "No";

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
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border p-3 transition-all",
        enabled
          ? "border-sky-300/30 bg-gradient-to-br from-sky-300/12 to-cyan-400/6"
          : "border-white/12 bg-white/[0.02] opacity-70",
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity",
          enabled ? "bg-white/[0.03] group-hover:opacity-100" : "",
        ].join(" ")}
      />

      <div className="relative flex items-start gap-3">
        <div className="min-w-0 w-full">
          <div className="flex items-center gap-2">
            <div
              className={[
                "h-2 w-2 shrink-0 rounded-full",
                enabled ? "bg-emerald-300" : "bg-slate-500/80",
              ].join(" ")}
            />
            <div className="text-sm font-semibold text-slate-100 whitespace-normal break-words">
              {label}
            </div>
          </div>

          {metaText ? (
            <div className="mt-1.5 break-words text-xs leading-5 text-slate-300/75">
              {metaText}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
