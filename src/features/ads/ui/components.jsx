import { AD_FORMATS, AD_STATUSES } from "@/features/ads/constants";

const STATUS_STYLES = {
  [AD_STATUSES.DRAFT]: "border-slate-300/25 bg-slate-800/50 text-slate-200",
  [AD_STATUSES.ACTIVE]: "border-emerald-300/35 bg-emerald-500/20 text-emerald-200",
  [AD_STATUSES.PAUSED]: "border-amber-300/35 bg-amber-500/20 text-amber-200",
  [AD_STATUSES.ARCHIVED]: "border-slate-400/20 bg-slate-900/50 text-slate-400",
};

export function AdStatusPill({ status }) {
  const safe = status || AD_STATUSES.DRAFT;
  return (
    <span className={["rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide", STATUS_STYLES[safe]].join(" ")}>
      {safe}
    </span>
  );
}

export function AdsEmptyState({ onCreate }) {
  return (
    <div className="settings-card-surface rounded-2xl px-4 py-5">
      <div className="text-sm font-semibold text-slate-100">No ads yet</div>
      <div className="mt-1 text-xs text-slate-400">
        Create your first VPORT ad campaign. Monetization controls are coming soon.
      </div>
      <button onClick={onCreate} className="settings-btn settings-btn--primary mt-3 px-3 py-2 text-sm">
        Create ad
      </button>
    </div>
  );
}

export function AdsList({ ads, selectedId, onSelect }) {
  return (
    <div className="space-y-2">
      {ads.map((ad) => {
        const active = selectedId === ad.id;
        return (
          <button
            key={ad.id}
            type="button"
            onClick={() => onSelect(ad)}
            className={[
              "settings-card-surface w-full rounded-2xl px-3 py-3 text-left transition",
              active ? "ring-1 ring-indigo-400/60" : "hover:bg-slate-900/55",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-100">{ad.title || "Untitled ad"}</div>
                <div className="mt-0.5 text-xs text-slate-400">{ad.format}</div>
              </div>
              <AdStatusPill status={ad.status} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function AdEditor({
  draft,
  fieldErrors = {},
  saving,
  onChange,
  onSave,
  onPublish,
  onPause,
  onArchive,
  onDelete,
}) {
  if (!draft) return null;

  return (
    <div className="settings-card-surface rounded-2xl p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-100">Ad editor</div>
        <AdStatusPill status={draft.status} />
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs text-slate-400">Title</span>
          <input
            value={draft.title}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
            className="settings-input rounded-xl px-3 py-2 text-sm"
            placeholder="Weekend burger special"
          />
          {fieldErrors.title ? <span className="text-xs text-rose-300">{fieldErrors.title}</span> : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-400">Description</span>
          <textarea
            value={draft.description}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            className="settings-input min-h-20 rounded-xl px-3 py-2 text-sm"
            placeholder="Tell people what this ad is about"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Media URL</span>
            <input
              value={draft.mediaUrl}
              onChange={(e) => onChange({ ...draft, mediaUrl: e.target.value })}
              className="settings-input rounded-xl px-3 py-2 text-sm"
              placeholder="https://..."
            />
            {fieldErrors.mediaUrl ? <span className="text-xs text-rose-300">{fieldErrors.mediaUrl}</span> : null}
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Destination URL</span>
            <input
              value={draft.destinationUrl}
              onChange={(e) => onChange({ ...draft, destinationUrl: e.target.value })}
              className="settings-input rounded-xl px-3 py-2 text-sm"
              placeholder="https://..."
            />
            {fieldErrors.destinationUrl ? <span className="text-xs text-rose-300">{fieldErrors.destinationUrl}</span> : null}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Format</span>
            <select
              value={draft.format}
              onChange={(e) => onChange({ ...draft, format: e.target.value })}
              className="settings-input rounded-xl px-3 py-2 text-sm"
            >
              {AD_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Budget (future)</span>
            <input
              type="number"
              min={0}
              value={draft.budget}
              onChange={(e) => onChange({ ...draft, budget: Number(e.target.value || 0) })}
              className="settings-input rounded-xl px-3 py-2 text-sm"
              placeholder="0"
            />
            {fieldErrors.budget ? <span className="text-xs text-rose-300">{fieldErrors.budget}</span> : null}
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={saving}
          className="settings-btn settings-btn--ghost border px-3 py-2 text-xs"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => onPublish(draft)}
          disabled={saving}
          className="settings-btn settings-btn--primary border px-3 py-2 text-xs"
        >
          Publish
        </button>
        <button type="button" onClick={() => onPause(draft)} className="settings-btn settings-btn--ghost border px-3 py-2 text-xs">
          Pause
        </button>
        <button type="button" onClick={() => onArchive(draft)} className="settings-btn settings-btn--ghost border px-3 py-2 text-xs">
          Archive
        </button>
        <button type="button" onClick={() => onDelete(draft)} className="settings-btn settings-btn--danger border px-3 py-2 text-xs">
          Delete
        </button>
      </div>
    </div>
  );
}
