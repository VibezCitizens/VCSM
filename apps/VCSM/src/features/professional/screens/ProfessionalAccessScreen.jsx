import { useNavigate } from 'react-router-dom'

import NurseHomeScreen from '@/features/professional/professional-nurse/screens/NurseHomeScreen'
import '@/features/settings/styles/settings-modern.css'

export default function ProfessionalAccessScreen() {
  const navigate = useNavigate()

  return (
    <div className="settings-modern-page min-h-full px-4 pb-24 pt-3 text-white">
      <section className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Nurse Notes Workspace</h1>
          <p className="text-sm text-white/60">
            Focused workspace for verified nurses to share housing and hospital notes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
        >
          Back
        </button>
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-2">
        <InfoCard
          title="Housing Notes"
          subtitle="Add notes about places to stay near hospitals."
        />
        <InfoCard
          title="Hospital Notes"
          subtitle="Add nurse-to-nurse insights on units and work conditions."
        />
      </section>

      <NurseHomeScreen profession="nurse" />
    </div>
  )
}

function InfoCard({ title, subtitle }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <div className="text-sm font-semibold text-white">{title}</div>
      <p className="mt-1 text-xs text-white/60">{subtitle}</p>
    </div>
  )
}
