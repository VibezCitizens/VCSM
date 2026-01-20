/**
 * ============================================================
 * AddForm
 * ------------------------------------------------------------
 * Responsive Add Form Container
 *
 * - Mobile: bottom sheet
 * - Desktop: centered modal
 *
 * RULES:
 * - UI-only
 * - No routing
 * - No data access
 * ============================================================
 */

import AddHousingExperienceForm from
  '@/features/professional/professional-nurse/housing/ui/AddHousingExperienceForm'

export default function AddForm({ location, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* PANEL */}
      <div
        className="
          relative
          w-full
          md:w-[520px]
          max-h-[85dvh]
          overflow-y-auto
          bg-black
          border border-white/10
          rounded-t-2xl md:rounded-2xl
          px-4 py-5
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">
            Add Housing Experience
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/60 text-lg hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <AddHousingExperienceForm location={location} />
      </div>
    </div>
  )
}
