export default function VibeTagPicker({
  tags = [],
  selectedTagIds = new Set(),
  onToggleTag,
  onSave,
  saving = false,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/4/60 p-4">
      <h3 className="text-sm font-semibold text-white">Select your vibe tags</h3>

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
                  ? 'border-purple-400 bg-purple-500/15 text-purple-300'
                  : 'border-white/15 bg-white/6 text-white/70'
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
          className="rounded-xl bg-purple-500/60 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save tags'}
        </button>
      </div>
    </section>
  )
}

