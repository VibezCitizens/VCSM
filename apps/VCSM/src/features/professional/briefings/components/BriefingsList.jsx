function toneClassByPriority(priority) {
  if (priority === 'critical') return 'border-rose-300/40 bg-rose-300/10 text-rose-100'
  if (priority === 'high') return 'border-amber-300/40 bg-amber-300/10 text-amber-100'
  if (priority === 'medium') return 'border-indigo-300/35 bg-indigo-300/10 text-indigo-100'
  return 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100'
}

export default function BriefingsList({
  items,
  loading,
  error,
  onMarkSeen,
  onOpenItem,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-slate-300">
        Loading briefings...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-300/35 bg-rose-300/10 px-3 py-4 text-sm text-rose-100">
        {error}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-3 py-4 text-sm text-slate-400">
        No briefings match the current filters.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onMarkSeen}
          className="settings-btn settings-btn--ghost px-3 py-1.5 text-xs font-semibold"
        >
          Mark visible as seen
        </button>
      </div>

      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpenItem(item)}
          className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition hover:bg-white/[0.08]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{item.title}</div>
              <div className="mt-1 text-xs text-slate-400">
                {item.domain} | {item.kind || item.objectType || 'update'} | {item.createdAt || 'now'}
              </div>
            </div>

            <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${toneClassByPriority(item.priority)}`}>
              {item.priority}
            </span>
          </div>

          {!item.isSeen && (
            <div className="mt-2 inline-flex rounded-full border border-indigo-300/40 bg-indigo-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-indigo-100">
              unseen
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
