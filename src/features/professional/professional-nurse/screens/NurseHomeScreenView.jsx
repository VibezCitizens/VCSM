import { useState } from 'react'

import NurseWorkspaceTabs from './views/NurseWorkspaceTabs'
import HousingTabView from './views/HousingTabView'
import FacilityInsightsTabView from './views/FacilityInsightsTabView'
import CityLivingTabView from './views/CityLivingTabView'
import CitySelector from '@/features/professional/professional-nurse/housing/ui/CitySelector'
import AddForm from '@/features/professional/professional-nurse/housing/ui/AddForm'

import NurseAddMenu from './views/NurseAddMenu'

export default function NurseHomeScreenView() {
  const [location, setLocation] = useState({
    state: 'TX',
    city: 'Austin',
    zip: '',
  })

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addType, setAddType] = useState(null)

  return (
    <>
      <div className="flex flex-col px-4 pb-24 space-y-6">
        {/* ================= HEADER ================= */}
        <section className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Nurses Notes
            </h1>
            <p className="text-sm text-white/60">
              Verified nurse workspace
            </p>
          </div>

          <button
            onClick={(e) => {
              setMenuAnchor(e.currentTarget.getBoundingClientRect())
              setMenuOpen(true)
            }}
            className="
              h-9 w-9 rounded-full
              bg-white text-black
              text-xl font-semibold
              active:scale-95
            "
          >
            +
          </button>
        </section>

        {/* ================= LOCATION ================= */}
        <CitySelector value={location} onChange={setLocation} />

        {/* ================= TABS ================= */}
        <NurseWorkspaceTabs
          housingView={<HousingTabView location={location} />}
          facilityView={<FacilityInsightsTabView location={location} />}
          cityLivingView={<CityLivingTabView location={location} />}
        />
      </div>

      {/* ================= ADD MENU ================= */}
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
        onFood={() => {
          setAddType('food')
          setMenuOpen(false)
          setShowAddForm(true)
        }}
      />

      {/* ================= FORM ================= */}
      {showAddForm && (
        <AddForm
          location={location}
          type={addType}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </>
  )
}
