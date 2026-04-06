import HousingNotesList from '@/features/professional/professional-nurse/housing/ui/HousingNotesList'

export default function HousingTabView({ location, query = '', notes = [] }) {
  return (
    <div className="space-y-4">
      <section className="space-y-1">
        <h2 className="text-sm font-semibold text-white">
          Housing - {location.city}, {location.state}
        </h2>
        <p className="text-sm text-white/60">
          Housing recommendations shared by verified travel nurses.
        </p>
      </section>

      <HousingNotesList notes={notes} location={location} query={query} />
    </div>
  )
}
