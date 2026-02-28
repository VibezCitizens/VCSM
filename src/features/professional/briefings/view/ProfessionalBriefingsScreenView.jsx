import { useNavigate } from 'react-router-dom'

import Card from '@/features/settings/ui/Card'
import useProfessionalBriefings from '@/features/professional/briefings/hooks/useProfessionalBriefings'
import BriefingsFilters from '@/features/professional/briefings/components/BriefingsFilters'
import BriefingsSummaryCards from '@/features/professional/briefings/components/BriefingsSummaryCards'
import BriefingsList from '@/features/professional/briefings/components/BriefingsList'
import '@/features/settings/styles/settings-modern.css'

export default function ProfessionalBriefingsScreenView({ actorId }) {
  const navigate = useNavigate()
  const {
    items,
    summary,
    loading,
    error,
    filters,
    setFilters,
    domainOptions,
    markVisibleSeen,
    reload,
  } = useProfessionalBriefings({ actorId })

  return (
    <div className="settings-modern-page min-h-full px-4 pb-24 pt-3 text-white">
      <section className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Professional Briefings</h1>
          <p className="text-sm text-white/60">Operational and compliance briefing stream for your actor.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => reload()}
            className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
          >
            Back
          </button>
        </div>
      </section>

      <Card>
        <div className="space-y-3 p-2">
          <BriefingsFilters
            filters={filters}
            setFilters={setFilters}
            domainOptions={domainOptions}
          />
          <BriefingsSummaryCards summary={summary} />
          <BriefingsList
            items={items}
            loading={loading}
            error={error}
            onMarkSeen={markVisibleSeen}
            onOpenItem={(item) => {
              if (item.linkPath) navigate(item.linkPath)
            }}
          />
        </div>
      </Card>
    </div>
  )
}
