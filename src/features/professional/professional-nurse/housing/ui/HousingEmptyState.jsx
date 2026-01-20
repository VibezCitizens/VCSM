/**
 * ============================================================
 * HousingEmptyState
 * ------------------------------------------------------------
 * UI-only empty state for nurse housing notes
 *
 * PURPOSE:
 * - Displayed when no housing notes exist for a city
 * - Encourages contribution without pressure
 *
 * RULES:
 * - No data fetching
 * - No domain logic
 * - No verification logic
 * ============================================================
 */

export default function HousingEmptyState() {
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
        No housing notes yet
      </div>

      <p className="mt-1 text-sm text-white/60">
        Verified nurses haven’t shared housing experiences
        for this city yet.
      </p>

      <p className="mt-3 text-xs text-white/40">
        Housing notes are experience-based and visible only
        to verified nurses.
      </p>
    </div>
  )
}
