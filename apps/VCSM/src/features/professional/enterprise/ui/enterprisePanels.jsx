import Card from '@/features/settings/adapters/ui/Card.adapter'
import {
  IncidentRow,
  ProgramRow,
  AuditRow,
  VendorRow,
  TimelineRow,
  EmptyLine,
} from '@/features/professional/enterprise/ui/enterpriseRows'

export function OverviewPanel({ view }) {
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
              <div className="text-xs uppercase tracking-[0.1em] text-white/50">{item.label}</div>
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

export function OperationsPanel({ view }) {
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

export function CompliancePanel({ view }) {
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

export function MarketplacePanel({ view }) {
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
                <div className="mt-1 text-xs text-white/50">
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

export function IntelligencePanel({ view }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Knowledge Base">
        <div className="space-y-2">
          {view.knowledge.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <div className="mt-1 text-xs text-white/50">
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
              <div className="mt-1 text-xs text-white/50">
                {item.domain} | Success {item.successRate}% | Runs {item.runsThisWeek}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
