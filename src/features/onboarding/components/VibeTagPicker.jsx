export default function VibeTagPicker({
  tags = [],
  selectedTagIds = new Set(),
  onToggleTag,
  onSave,
  saving = false,
}) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Select your vibe tags</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {(Array.isArray(tags) ? tags : []).map((tag) => {
          const selected = selectedTagIds?.has?.(tag.id) === true
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag?.(tag.id)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                selected
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                  : 'border-slate-600 bg-slate-800/60 text-slate-300'
              }`}
            >
              {tag.name}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-indigo-500/80 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save tags'}
        </button>
      </div>
    </section>
  )
}

