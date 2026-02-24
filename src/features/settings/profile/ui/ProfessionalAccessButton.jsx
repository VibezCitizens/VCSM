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
        settings-card-surface
        settings-btn
        w-full
        mt-4
        px-4
        py-3
        rounded-xl
        hover:bg-slate-800/80
        active:bg-slate-800/95
        text-left
        transition
      "
    >
      <div className="flex flex-col">
        <span className="text-[16px] font-semibold text-slate-100">
          Professional Access
        </span>
        <span className="mt-0.5 text-[13px] text-slate-400">
          Apply or manage professional features
        </span>
      </div>
    </button>
  )
}
