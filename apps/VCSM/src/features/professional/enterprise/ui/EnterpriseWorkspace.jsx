import Card from '@/features/settings/adapters/ui/Card.adapter'
import useEnterpriseWorkspace from '@/features/professional/enterprise/hooks/useEnterpriseWorkspace'
import {
  OverviewPanel,
  OperationsPanel,
  CompliancePanel,
  MarketplacePanel,
  IntelligencePanel,
} from '@/features/professional/enterprise/ui/enterprisePanels'

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
              <div className="text-xs uppercase tracking-[0.12em] text-white/50">Enterprise Console</div>
              <h2 className="mt-1 text-lg font-semibold text-white">{profession.label} Command Center</h2>
              <p className="mt-1 text-sm text-white/70/85">
                Multi-domain operations layer for {profession.sector.toLowerCase()} execution and scale.
              </p>
            </div>
            <div className="rounded-lg border border-purple-300/20 bg-purple-300/10 px-3 py-1.5 text-xs text-purple-200">
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
                  ? 'border-purple-300/40 bg-purple-300/12 text-white'
                  : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
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
