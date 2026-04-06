export default function FacilityInsightsTabView({ location, query = '', notes = [] }) {
  const cityMatch = location?.city?.trim()?.toLowerCase()
  const stateMatch = location?.state?.trim()?.toLowerCase()
  const needle = query.trim().toLowerCase()

  const filtered = notes.filter((item) => {
    const itemCity = String(item.city || '').toLowerCase()
    const matchesLocation =
      (!cityMatch || itemCity.includes(cityMatch)) && (!stateMatch || itemCity.includes(stateMatch))

    if (!matchesLocation) return false
    if (!needle) return true

    return [item.facilityName, item.unit, item.summary, item.city]
      .join(' ')
      .toLowerCase()
      .includes(needle)
  })

  return (
    <div className="space-y-4">
      <section className="space-y-1">
        <h2 className="text-sm font-semibold text-white">Facility Reviews</h2>
        <p className="text-sm text-white/60">
          Nurse-to-nurse hospital insights for {location.city}, {location.state}. Visible only to verified nurses.
        </p>
      </section>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <FacilityInsightCard
              key={item.id}
              facilityName={item.facilityName}
              city={item.city}
              unit={item.unit}
              summary={item.summary}
              createdAtLabel={item.createdAtLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FacilityInsightCard({ facilityName, city, unit, summary, createdAtLabel }) {
  return (
    <div className="space-y-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-white">{facilityName}</div>
          <div className="text-xs text-white/60">
            {city} - {unit}
          </div>
        </div>
        {createdAtLabel && <div className="whitespace-nowrap text-xs text-white/40">{createdAtLabel}</div>}
      </div>

      <p className="text-sm text-white/70">{summary}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center">
      <div className="text-sm font-semibold text-white">No facility insights yet</div>
      <p className="mt-1 text-sm text-white/60">
        Verified nurses have not shared hospital notes for this location yet.
      </p>
      <p className="mt-3 text-xs text-white/40">
        Tap + to add the first hospital note.
      </p>
    </div>
  )
}
