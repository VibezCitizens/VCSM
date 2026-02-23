import React, { useMemo } from "react";

function metaSummary(meta) {
  if (!meta) return "";
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

export default function VportServiceToggleRow({
  service,
  onToggleService = null,
  onEditServiceMeta = null,
}) {
  const key = (service?.key ?? "").toString();
  const label = (service?.label ?? service?.name ?? service?.key ?? "Service").toString();
  const enabled = service?.enabled !== false;

  const metaText = useMemo(() => metaSummary(service?.meta ?? null), [service]);

  const canToggle = typeof onToggleService === "function" && key;
  const canEditMeta = typeof onEditServiceMeta === "function" && key;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90 truncate">{label}</div>
          {metaText ? (
            <div className="mt-0.5 text-xs text-white/50 break-words">{metaText}</div>
          ) : null}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            disabled={!canEditMeta}
            onClick={canEditMeta ? () => onEditServiceMeta({ key }) : undefined}
            className={[
              "rounded-xl px-3 py-2 text-xs font-bold border",
              canEditMeta
                ? "border-white/10 bg-black/20 text-white/70 hover:bg-black/35"
                : "border-white/5 bg-black/10 text-white/30 cursor-not-allowed",
            ].join(" ")}
          >
            Edit
          </button>

          <button
            type="button"
            disabled={!canToggle}
            onClick={canToggle ? () => onToggleService({ key, enabled: !enabled }) : undefined}
            className={[
              "rounded-xl px-3 py-2 text-xs font-black border",
              enabled
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
                : "border-white/10 bg-black/10 text-white/45 hover:bg-black/20",
              !canToggle ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            {enabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
    </div>
  );
}