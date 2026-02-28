import Card from '@/features/settings/ui/Card'
import useEnterpriseWorkspace from '@/features/professional/enterprise/hooks/useEnterpriseWorkspace'

const PANELS = Object.freeze([
  { key: 'overview', label: 'Overview' },
  { key: 'operations', label: 'Operations' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'intelligence', label: 'Intelligence' },
])

const PRIORITIES = Object.freeze([
  { key: 'all', label: 'All priorities' },
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
])

export default function EnterpriseWorkspace({ profession }) {
  const {
    panel,
    setPanel,
    city,
    setCity,
    priority,
    setPriority,
    query,
    setQuery,
    cityOptions,
    view,
  } = useEnterpriseWorkspace({ professionKey: profession.key })

  return (
    <section className="space-y-4">
      <Card className="px-2 pt-2 pb-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Enterprise Console</div>
              <h2 className="mt-1 text-lg font-semibold text-white">{profession.label} Command Center</h2>
              <p className="mt-1 text-sm text-slate-300/85">
                Multi-domain operations layer for {profession.sector.toLowerCase()} execution and scale.
              </p>
            </div>
            <div className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-1.5 text-xs text-indigo-100">
              Compliance scope: {profession.complianceScope}
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search incidents, controls, vendors, or docs"
              className="settings-input rounded-xl px-3 py-2 text-sm"
            />

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="settings-input rounded-xl px-3 py-2 text-sm"
            >
              {cityOptions.map((item) => (
                <option key={item} value={item}>
                  {item === 'all' ? 'All cities' : item}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="settings-input rounded-xl px-3 py-2 text-sm"
            >
              {PRIORITIES.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {PANELS.map((item) => {
          const active = panel === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setPanel(item.key)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-indigo-300/60 bg-indigo-300/15 text-white'
                  : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {panel === 'overview' && <OverviewPanel view={view} />}
      {panel === 'operations' && <OperationsPanel view={view} />}
      {panel === 'compliance' && <CompliancePanel view={view} />}
      {panel === 'marketplace' && <MarketplacePanel view={view} />}
      {panel === 'intelligence' && <IntelligencePanel view={view} />}
    </section>
  )
}

function OverviewPanel({ view }) {
  const kpis = [
    { key: 'openItems', label: 'Open items', value: view.kpis.openItems },
    { key: 'openCritical', label: 'Critical queue', value: view.kpis.openCritical },
    { key: 'onTrackPrograms', label: 'Programs on track', value: view.kpis.onTrackPrograms },
    { key: 'auditReadiness', label: 'Audit readiness', value: `${view.kpis.auditReadiness}%` },
    { key: 'partnerHealth', label: 'Partner health', value: `${view.kpis.partnerHealth}%` },
    { key: 'weeklyResolutionRate', label: 'Resolution rate', value: `${view.kpis.weeklyResolutionRate}%` },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((item) => (
          <Card key={item.key}>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
              <div className="text-xs uppercase tracking-[0.1em] text-slate-400">{item.label}</div>
              <div className="mt-1 text-2xl font-semibold text-white">{item.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Strategic Programs">
        <div className="space-y-2">
          {view.programs.map((program) => (
            <ProgramRow key={program.id} program={program} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function OperationsPanel({ view }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Active Incident Queue">
        <div className="space-y-2">
          {view.incidents.length === 0 ? (
            <EmptyLine label="No incidents for current filters." />
          ) : (
            view.incidents.map((item) => <IncidentRow key={item.id} item={item} />)
          )}
        </div>
      </Card>

      <Card title="Live Ops Timeline">
        <div className="space-y-2">
          {view.timeline.map((item) => (
            <TimelineRow key={item.id} item={item} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function CompliancePanel({ view }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Control Readiness Board">
        <div className="space-y-2">
          {view.audits.map((item) => (
            <AuditRow key={item.id} item={item} />
          ))}
        </div>
      </Card>

      <Card title="Program Risk Radar">
        <div className="space-y-2">
          {view.programs.map((program) => (
            <ProgramRow key={program.id} program={program} compact />
          ))}
        </div>
      </Card>
    </div>
  )
}

function MarketplacePanel({ view }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Partner Scorecards">
        <div className="space-y-2">
          {view.vendors.length === 0 ? (
            <EmptyLine label="No partners for current filters." />
          ) : (
            view.vendors.map((vendor) => <VendorRow key={vendor.id} vendor={vendor} />)
          )}
        </div>
      </Card>

      <Card title="Operational Procurement Queue">
        <div className="space-y-2">
          {view.incidents.length === 0 ? (
            <EmptyLine label="No procurement escalations right now." />
          ) : (
            view.incidents.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <div className="mt-1 text-xs text-slate-400">
                  Owner: {item.owner} | Target SLA: {item.sla}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

function IntelligencePanel({ view }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Knowledge Base">
        <div className="space-y-2">
          {view.knowledge.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <div className="mt-1 text-xs text-slate-400">
                {item.category} | {item.status} | {item.updatedAt}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Automation Playbooks">
        <div className="space-y-2">
          {view.playbooks.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-sm font-semibold text-white">{item.name}</div>
              <div className="mt-1 text-xs text-slate-400">
                {item.domain} | Success {item.successRate}% | Runs {item.runsThisWeek}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function IncidentRow({ item }) {
  const tone =
    item.priority === 'critical'
      ? 'border-rose-300/35 bg-rose-300/10 text-rose-100'
      : item.priority === 'high'
      ? 'border-amber-300/35 bg-amber-300/10 text-amber-100'
      : 'border-slate-300/20 bg-white/[0.03] text-slate-200'

  return (
    <div className={`rounded-xl border px-3 py-2 ${tone}`}>
      <div className="text-sm font-semibold">{item.title}</div>
      <div className="mt-1 text-xs opacity-90">
        {item.city} | {item.owner} | SLA {item.sla}
      </div>
    </div>
  )
}

function ProgramRow({ program, compact = false }) {
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
      <div className="mt-1 text-xs text-slate-400">
        Lead: {program.lead} {!compact && `| Coverage ${program.coverage}%`}
      </div>
    </div>
  )
}

function AuditRow({ item }) {
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
      <div className="mt-1 text-xs text-slate-400">Due in {item.dueIn}</div>
    </div>
  )
}

function VendorRow({ vendor }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{vendor.name}</div>
        <span className="rounded-full border border-indigo-300/35 bg-indigo-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-indigo-100">
          Score {vendor.score}
        </span>
      </div>
      <div className="mt-1 text-xs text-slate-400">
        {vendor.type} | {vendor.city}
      </div>
    </div>
  )
}

function TimelineRow({ item }) {
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
        <div className="mt-1 text-xs text-slate-400">At {item.when}</div>
      </div>
    </div>
  )
}

function EmptyLine({ label }) {
  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-3 py-3 text-sm text-slate-400">
      {label}
    </div>
  )
}
