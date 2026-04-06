export default function BriefingsSummaryCards({ summary }) {
  const cards = [
    { key: 'total', label: 'Total', value: summary?.total ?? 0 },
    { key: 'unseen', label: 'Unseen', value: summary?.unseen ?? 0 },
    { key: 'unread', label: 'Unread', value: summary?.unread ?? 0 },
    { key: 'critical', label: 'Critical', value: summary?.byPriority?.critical ?? 0 },
  ]

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="text-xs uppercase tracking-[0.1em] text-slate-400">{card.label}</div>
          <div className="mt-1 text-2xl font-semibold text-white">{card.value}</div>
        </div>
      ))}
    </div>
  )
}
