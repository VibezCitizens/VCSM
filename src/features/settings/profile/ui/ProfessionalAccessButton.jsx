/**
 * ============================================================
 * ProfessionalAccessButton
 * ------------------------------------------------------------
 * UI-only button
 *
 * PURPOSE:
 * - Shows a "Professional Access" button in Profile Settings
 * - No routing
 * - No permissions
 * - No business logic
 *
 * Phase 1: visual only
 * ============================================================
 */

export default function ProfessionalAccessButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full
        mt-4
        px-4
        py-3
        rounded-xl
        bg-white/10
        hover:bg-white/15
        active:bg-white/20
        border
        border-white/15
        text-left
        transition
      "
    >
      <div className="flex flex-col">
        <span className="text-[16px] font-semibold text-white">
          Professional Access
        </span>
        <span className="text-[13px] text-white/60 mt-0.5">
          Apply or manage professional features
        </span>
      </div>
    </button>
  )
}
