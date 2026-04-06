import { useState } from 'react'

import AddForm from '@/features/professional/professional-nurse/housing/ui/AddForm'
import CitySelector from '@/features/professional/professional-nurse/housing/ui/CitySelector'
import FacilityInsightsTabView from './views/FacilityInsightsTabView'
import HousingTabView from './views/HousingTabView'
import NurseAddMenu from './views/NurseAddMenu'
import NurseWorkspaceTabs from './views/NurseWorkspaceTabs'

const INITIAL_HOUSING_NOTES = Object.freeze([
  {
    id: 1,
    title: 'Quiet furnished studio near hospital',
    description:
      'Safe area, about a 10-minute drive to night shift parking. Landlord was flexible with a 13-week lease.',
    categories: ['Safety', 'Commute', 'Landlord', 'Furnished'],
    authorLabel: 'Shared by a verified travel nurse',
    createdAtLabel: '2 weeks ago',
    state: 'TX',
    city: 'Austin',
  },
  {
    id: 2,
    title: 'Apartment complex close to ER',
    description: 'Walking distance but noisy on weekends. Parking garage felt safe. Utilities included.',
    categories: ['Commute', 'Noise', 'Parking', 'Utilities'],
    authorLabel: 'Shared by a verified nurse',
    createdAtLabel: '1 month ago',
    state: 'TX',
    city: 'Austin',
  },
])

const INITIAL_FACILITY_NOTES = Object.freeze([
  {
    id: 1,
    facilityName: 'Regional Medical Center',
    city: 'Austin, TX',
    unit: 'ICU',
    summary: 'Night shift ratios were generally safe. Charge nurses were supportive and organized.',
    createdAtLabel: '3 weeks ago',
  },
  {
    id: 2,
    facilityName: "St. Luke's Health",
    city: 'Austin, TX',
    unit: 'ER',
    summary: 'Triage workflow was strong. Float requests were occasional and communicated early.',
    createdAtLabel: '9 days ago',
  },
])

export default function NurseHomeScreenView() {
  const [location, setLocation] = useState({
    state: 'TX',
    city: 'Austin',
    zip: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [housingNotes, setHousingNotes] = useState(() => [...INITIAL_HOUSING_NOTES])
  const [facilityNotes, setFacilityNotes] = useState(() => [...INITIAL_FACILITY_NOTES])

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addType, setAddType] = useState('housing')

  return (
    <>
      <div className="flex flex-col space-y-6 pb-8">
        <section className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Nurse Notes</h1>
            <p className="text-sm text-white/60">Housing + hospital notes from verified nurses.</p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              setMenuAnchor(e.currentTarget.getBoundingClientRect())
              setMenuOpen(true)
            }}
            className="h-9 w-9 rounded-full bg-white text-xl font-semibold text-black active:scale-95"
            aria-label="Add note"
          >
            +
          </button>
        </section>

        <CitySelector value={location} onChange={setLocation} />

        <section className="space-y-2">
          <label
            htmlFor="nurse-notes-search"
            className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45"
          >
            Search notes
          </label>
          <input
            id="nurse-notes-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search housing or hospital notes"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none focus:border-indigo-300/60 focus:bg-white/10"
          />
        </section>

        <NurseWorkspaceTabs
          housingView={
            <HousingTabView
              location={location}
              query={searchQuery}
              notes={housingNotes}
            />
          }
          facilityView={
            <FacilityInsightsTabView
              location={location}
              query={searchQuery}
              notes={facilityNotes}
            />
          }
        />
      </div>

      <NurseAddMenu
        open={menuOpen}
        anchorRect={menuAnchor}
        onClose={() => setMenuOpen(false)}
        onHousing={() => {
          setAddType('housing')
          setMenuOpen(false)
          setShowAddForm(true)
        }}
        onFacility={() => {
          setAddType('facility')
          setMenuOpen(false)
          setShowAddForm(true)
        }}
      />

      {showAddForm && (
        <AddForm
          location={location}
          type={addType}
          onClose={() => setShowAddForm(false)}
          onSubmitHousing={(note) => {
            setHousingNotes((prev) => [note, ...prev])
          }}
          onSubmitFacility={(note) => {
            setFacilityNotes((prev) => [note, ...prev])
          }}
        />
      )}
    </>
  )
}
