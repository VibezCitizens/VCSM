/**
 * ============================================================
 * HousingTabView
 * ------------------------------------------------------------
 * Nurse Workspace → Housing Tab (UI-only)
 *
 * PURPOSE:
 * - Displays nurse housing & city notes
 * - Experience-based housing intelligence
 *
 * RULES:
 * - No routing
 * - No data access
 * - No business logic
 * - No verification logic
 * ============================================================
 */

import HousingNotesList from '@/features/professional/professional-nurse/housing/ui/HousingNotesList'

export default function HousingTabView({ location }) {
  /* ================= UI-ONLY PREVIEW DATA ================= */
  const notes = [
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
      description:
        'Walking distance but noisy on weekends. Parking garage felt safe. Utilities included.',
      categories: ['Commute', 'Noise', 'Parking', 'Utilities'],
      authorLabel: 'Shared by a verified nurse',
      createdAtLabel: '1 month ago',
      state: 'TX',
      city: 'Austin',
    },
  ]

  return (
    <div className="space-y-4">
      {/* ================= HEADER ================= */}
      <section className="space-y-1">
        <h2 className="text-sm font-semibold text-white">
          Housing · {location.city}, {location.state}
        </h2>
        <p className="text-sm text-white/60">
          Housing recommendations shared by verified travel nurses.
        </p>
      </section>

      {/* ================= NOTES LIST ================= */}
      <HousingNotesList
        notes={notes}
        location={location}
      />
    </div>
  )
}
