import React from "react";

export default function VportSettingsAdsPreview({ ads = [], actorId, onOpen }) {
  return (
    <div className="space-y-3 px-2 pb-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Ads preview</div>
        <button
          type="button"
          onClick={() => onOpen?.(actorId)}
          className="settings-btn settings-btn--ghost border px-3 py-1.5 text-xs"
        >
          Open ads pipeline
        </button>
      </div>

      {!ads.length ? (
        <div className="rounded-xl border border-white/8 bg-white/4/35 px-3 py-3 text-xs text-white/50">
          No ads created yet.
        </div>
      ) : (
        <div className="space-y-2">
          {ads.slice(0, 3).map((ad) => (
            <div key={ad.id} className="rounded-xl border border-white/8 bg-white/4/35 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{ad.title || "Untitled ad"}</div>
                  <div className="mt-0.5 text-xs text-white/50">{ad.format}</div>
                </div>
                <span className="rounded-full border border-white/12 bg-white/6/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
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
