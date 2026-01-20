/**
 * ============================================================
 * HousingNotesList
 * ------------------------------------------------------------
 * Shared housing notes list (UI-only)
 *
 * PURPOSE:
 * - Renders filtered housing notes for a location
 * - Shared by tab + standalone screen
 *
 * RULES:
 * - UI-only
 * - No data access
 * ============================================================
 */

import HousingNoteCard from './HousingNoteCard'
import HousingEmptyState from './HousingEmptyState'

export default function HousingNotesList({ notes, location }) {
  const filteredNotes = notes.filter(
    (n) =>
      n.state === location.state &&
      n.city === location.city
  )

  if (filteredNotes.length === 0) {
    return <HousingEmptyState />
  }

  return (
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
  )
}
