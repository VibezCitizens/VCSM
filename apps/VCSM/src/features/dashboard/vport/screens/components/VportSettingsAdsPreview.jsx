import React from "react";

export default function VportSettingsAdsPreview({ ads = [], actorId, onOpen }) {
  return (
    <div className="space-y-3 px-2 pb-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-100">Ads preview</div>
        <button
          type="button"
          onClick={() => onOpen?.(actorId)}
          className="settings-btn settings-btn--ghost border px-3 py-1.5 text-xs"
        >
          Open ads pipeline
        </button>
      </div>

      {!ads.length ? (
        <div className="rounded-xl border border-slate-300/10 bg-slate-900/35 px-3 py-3 text-xs text-slate-400">
          No ads created yet.
        </div>
      ) : (
        <div className="space-y-2">
          {ads.slice(0, 3).map((ad) => (
            <div key={ad.id} className="rounded-xl border border-slate-300/10 bg-slate-900/35 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-100">{ad.title || "Untitled ad"}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{ad.format}</div>
                </div>
                <span className="rounded-full border border-slate-300/20 bg-slate-800/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                  {ad.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
