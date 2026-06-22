/**
 * ============================================================
 * HousingNoteCard
 * ------------------------------------------------------------
 * UI-only card for displaying a nurse housing experience note
 *
 * PURPOSE:
 * - Displays one housing experience shared by a verified nurse
 * - Calm, professional tone
 *
 * RULES:
 * - No data access
 * - No business logic
 * - No permissions
 * - No side effects
 * ============================================================
 */

import HousingCategoryBadge from './HousingCategoryBadge'

export default function HousingNoteCard({
  title,
  description,
  categories = [],
  authorLabel,
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
      {/* ================= HEADER ================= */}
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-white">
          {title}
        </div>

        {createdAtLabel && (
          <div className="text-xs text-white/40 whitespace-nowrap">
            {createdAtLabel}
          </div>
        )}
      </div>

      {/* ================= DESCRIPTION ================= */}
      <p className="text-sm text-white/70">
        {description}
      </p>

      {/* ================= CATEGORIES ================= */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {categories.map((cat) => (
            <HousingCategoryBadge
              key={cat}
              label={cat}
            />
          ))}
        </div>
      )}

      {/* ================= FOOTER ================= */}
      {authorLabel && (
        <div className="pt-1 text-xs text-white/40">
          {authorLabel}
        </div>
      )}
    </div>
  )
}
