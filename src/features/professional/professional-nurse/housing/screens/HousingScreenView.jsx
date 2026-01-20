/**
 * ============================================================
 * HousingScreenView
 * ------------------------------------------------------------
 * Standalone Housing screen (UI-only)
 *
 * PURPOSE:
 * - Displays housing experiences for a given location
 * - Reusable outside Nurse Workspace tabs
 *
 * RULES:
 * - UI-only
 * - No routing
 * - No data access
 * - No business logic
 * ============================================================
 */

import HousingHeader from '@/features/professional/professional-nurse/housing/ui/HousingHeader'
import HousingNoteCard from '@/features/professional/professional-nurse/housing/ui/HousingNoteCard'
import HousingEmptyState from '@/features/professional/professional-nurse/housing/ui/HousingEmptyState'

export default function HousingScreenView({ location }) {
  // Defensive default (UI must never crash)
  const safeLocation = location ?? {
    state: '',
    city: '',
    zip: '',
  }

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

  const filteredNotes = notes.filter(
    (n) =>
      n.state === safeLocation.state &&
      n.city === safeLocation.city
  )

  return (
    <div className="space-y-6 px-4 pb-24">
      {/* ================= HEADER ================= */}
      <HousingHeader location={safeLocation} />

      {/* ================= NOTES ================= */}
      {filteredNotes.length === 0 ? (
        <HousingEmptyState />
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <HousingNoteCard
              key={note.id}
              title={note.title}
              description={note.description}
              categories={note.categories}
              authorLabel={note.authorLabel}
              createdAtLabel={note.createdAtLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
