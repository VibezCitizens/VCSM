export function IncidentRow({ item }) {
  const tone =
    item.priority === 'critical'
      ? 'border-rose-300/35 bg-rose-300/10 text-rose-100'
      : item.priority === 'high'
      ? 'border-amber-300/35 bg-amber-300/10 text-amber-100'
      : 'border-white/12 bg-white/[0.03] text-white/90'

  return (
    <div className={`rounded-xl border px-3 py-2 ${tone}`}>
      <div className="text-sm font-semibold">{item.title}</div>
      <div className="mt-1 text-xs opacity-90">
        {item.city} | {item.owner} | SLA {item.sla}
      </div>
    </div>
  )
}

export function ProgramRow({ program, compact = false }) {
  const statusClass =
    program.status === 'On track'
      ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100'
      : 'border-amber-300/35 bg-amber-300/10 text-amber-100'

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{program.name}</div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${statusClass}`}>
          {program.status}
        </span>
      </div>
      <div className="mt-1 text-xs text-white/50">
        Lead: {program.lead} {!compact && `| Coverage ${program.coverage}%`}
      </div>
    </div>
  )
}

export function AuditRow({ item }) {
  const statusClass =
    item.status === 'Pass'
      ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100'
      : item.status === 'Watch'
      ? 'border-amber-300/35 bg-amber-300/10 text-amber-100'
      : 'border-rose-300/35 bg-rose-300/10 text-rose-100'

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{item.control}</div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${statusClass}`}>
          {item.status}
        </span>
      </div>
      <div className="mt-1 text-xs text-white/50">Due in {item.dueIn}</div>
    </div>
  )
}

export function VendorRow({ vendor }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{vendor.name}</div>
        <span className="rounded-full border border-purple-300/25 bg-purple-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-purple-200">
          Score {vendor.score}
        </span>
      </div>
      <div className="mt-1 text-xs text-white/50">
        {vendor.type} | {vendor.city}
      </div>
    </div>
  )
}

export function TimelineRow({ item }) {
  const severityClass =
    item.severity === 'high'
      ? 'bg-rose-300/80'
      : item.severity === 'medium'
      ? 'bg-amber-300/80'
      : 'bg-emerald-300/80'

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${severityClass}`} />
      <div className="min-w-0">
        <div className="text-sm text-white">{item.label}</div>
        <div className="mt-1 text-xs text-white/50">At {item.when}</div>
      </div>
    </div>
  )
}

export function EmptyLine({ label }) {
  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-3 py-3 text-sm text-white/50">
      {label}
    </div>
  )
}
