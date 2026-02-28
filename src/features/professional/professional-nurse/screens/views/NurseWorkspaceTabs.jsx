import { useState } from 'react'

export default function NurseWorkspaceTabs({
  housingView,
  facilityView,
}) {
  const [tab, setTab] = useState('housing')

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
        <TabButton
          active={tab === 'housing'}
          onClick={() => setTab('housing')}
          label="Housing"
        />

        <TabButton
          active={tab === 'facility'}
          onClick={() => setTab('facility')}
          label="Facility Insights"
        />
      </div>

      <div>
        {tab === 'housing' && housingView}
        {tab === 'facility' && facilityView}
      </div>
    </div>
  )
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1
        rounded-lg
        px-3
        py-2
        text-sm
        font-semibold
        transition
        ${
          active
            ? 'bg-white text-black'
            : 'text-white/70 hover:bg-white/10'
        }
      `}
    >
      {label}
    </button>
  )
}
