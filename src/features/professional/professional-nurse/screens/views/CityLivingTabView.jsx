/**
 * ============================================================
 * CityLivingTabView
 * ------------------------------------------------------------
 * Nurse Workspace → City Living & Food Tab (UI-only)
 *
 * PURPOSE:
 * - Helps travel nurses live comfortably in a city
 * - Food, groceries, gyms, and daily-life recommendations
 *
 * FUTURE:
 * - Will be powered by VPORT data (restaurants, gyms, etc.)
 *
 * RULES:
 * - No routing
 * - No data access
 * - No business or verification logic
 * ============================================================
 */

export default function CityLivingTabView() {
  // TEMP UI-only preview data
  const items = [
    {
      id: 1,
      title: 'H-E-B Grocery',
      category: 'Groceries',
      description:
        'Affordable groceries, open late, easy parking. Popular with night-shift nurses.',
      city: 'Austin, TX',
    },
    {
      id: 2,
      title: 'Late Night Tacos',
      category: 'Food',
      description:
        'Food truck near hospital. Open past midnight, fast service after night shifts.',
      city: 'Austin, TX',
    },
    {
      id: 3,
      title: '24-Hour Fitness',
      category: 'Gym',
      description:
        'Safe, clean gym with showers. Good option before or after night shifts.',
      city: 'Austin, TX',
    },
    {
      id: 4,
      title: 'Sunrise Yoga Studio',
      category: 'Wellness',
      description:
        'Quiet yoga classes focused on recovery and stress relief.',
      city: 'Austin, TX',
    },
  ]

  return (
    <div className="space-y-4">
      {/* ================= INTRO ================= */}
      <section className="space-y-1">
        <h2 className="text-sm font-semibold text-white">
          City Living & Food
        </h2>
        <p className="text-sm text-white/60">
          Practical recommendations to help you live well while on assignment.
        </p>
      </section>

      {/* ================= LIST ================= */}
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <CityLivingCard
              key={item.id}
              title={item.title}
              category={item.category}
              description={item.description}
              city={item.city}
            />
          ))}
        </div>
      )}

      {/* ================= FOOTNOTE ================= */}
      <p className="pt-2 text-xs text-white/40">
        Some recommendations may later be powered by verified local VPORTs.
      </p>
    </div>
  )
}

/* ============================================================
   UI SUBCOMPONENTS
   ============================================================ */

function CityLivingCard({ title, category, description, city }) {
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
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-white">
            {title}
          </div>
          <div className="text-xs text-white/60">
            {category} · {city}
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <p className="text-sm text-white/70">
        {description}
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
        No city living notes yet
      </div>

      <p className="mt-1 text-sm text-white/60">
        Verified nurses haven’t shared daily-living recommendations for this city yet.
      </p>

      <p className="mt-3 text-xs text-white/40">
        These recommendations are experience-based and nurse-only.
      </p>
    </div>
  )
}
