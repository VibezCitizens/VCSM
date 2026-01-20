/**
 * ============================================================
 * FacilityInsightsTabView
 * ------------------------------------------------------------
 * Nurse Workspace → Facility Insights Tab (UI-only)
 *
 * PURPOSE:
 * - Displays nurse-to-nurse insights about facilities and units
 * - Focused on workplace reality and safety
 *
 * RULES:
 * - No routing
 * - No data access
 * - No names (patients, nurses, managers)
 * - No business or verification logic
 * ============================================================
 */

export default function FacilityInsightsTabView() {
  // TEMP UI-only preview data
  const facilities = [
    {
      id: 1,
      facilityName: 'Regional Medical Center',
      city: 'Austin, TX',
      unit: 'ICU',
      summary:
        'Night shift ratios were generally safe. Travelers floated about once per week. Charge nurses were supportive.',
      createdAtLabel: '3 weeks ago',
    },
    {
      id: 2,
      facilityName: 'Memorial Hospital',
      city: 'Denver, CO',
      unit: 'Med-Surg',
      summary:
        'High patient turnover. Floating was frequent during staffing shortages. Scheduling felt fair overall.',
      createdAtLabel: '1 month ago',
    },
  ]

  return (
    <div className="space-y-4">
      {/* ================= INTRO ================= */}
      <section className="space-y-1">
        <h2 className="text-sm font-semibold text-white">
          Facility Insights
        </h2>
        <p className="text-sm text-white/60">
          Nurse-to-nurse insights about workplace conditions and unit culture.
        </p>
      </section>

      {/* ================= INSIGHTS LIST ================= */}
      {facilities.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {facilities.map((f) => (
            <FacilityInsightCard
              key={f.id}
              facilityName={f.facilityName}
              city={f.city}
              unit={f.unit}
              summary={f.summary}
              createdAtLabel={f.createdAtLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   UI SUBCOMPONENTS
   ============================================================ */

function FacilityInsightCard({
  facilityName,
  city,
  unit,
  summary,
  createdAtLabel,
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-white/15
        bg-white/10
        px-4
        py-3
        space-y-2
      "
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-white">
            {facilityName}
          </div>
          <div className="text-xs text-white/60">
            {city} · {unit}
          </div>
        </div>

        {createdAtLabel && (
          <div className="text-xs text-white/40 whitespace-nowrap">
            {createdAtLabel}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      <p className="text-sm text-white/70">
        {summary}
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="
        rounded-xl
        border
        border-white/10
        bg-white/5
        px-4
        py-6
        text-center
      "
    >
      <div className="text-sm font-semibold text-white">
        No facility insights yet
      </div>

      <p className="mt-1 text-sm text-white/60">
        Verified nurses haven’t shared workplace insights for this area yet.
      </p>

      <p className="mt-3 text-xs text-white/40">
        Facility insights are anonymous and visible only to verified nurses.
      </p>
    </div>
  )
}
