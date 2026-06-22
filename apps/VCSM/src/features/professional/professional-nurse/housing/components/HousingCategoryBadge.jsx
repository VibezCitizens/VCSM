/**
 * ============================================================
 * HousingCategoryBadge
 * ------------------------------------------------------------
 * UI-only badge for housing categories
 *
 * PURPOSE:
 * - Visually represents a housing note category
 * - Used inside housing cards and lists
 *
 * RULES:
 * - No domain logic
 * - No data access
 * - Pure presentational component
 * ============================================================
 */

export default function HousingCategoryBadge({
  label,
  tone = 'default',
}) {
  const toneClasses = {
    default: 'bg-white/10 text-white/70 border-white/15',
    positive: 'bg-green-500/10 text-green-300 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    negative: 'bg-red-500/10 text-red-300 border-red-500/20',
  }

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-2
        py-0.5
        text-[11px]
        font-medium
        whitespace-nowrap
        ${toneClasses[tone] || toneClasses.default}
      `}
    >
      {label}
    </span>
  )
}
