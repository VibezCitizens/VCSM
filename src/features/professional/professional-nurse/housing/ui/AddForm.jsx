import AddFacilityInsightForm from '@/features/professional/professional-nurse/facility/ui/AddFacilityInsightForm'
import AddHousingExperienceForm from '@/features/professional/professional-nurse/housing/ui/AddHousingExperienceForm'

const TYPE_TITLE = Object.freeze({
  housing: 'Add Housing Note',
  facility: 'Add Hospital Note',
})

export default function AddForm({
  location,
  type = 'housing',
  onClose,
  onSubmitHousing,
  onSubmitFacility,
}) {
  const title = TYPE_TITLE[type] ?? TYPE_TITLE.housing

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-black px-4 py-5 md:w-[520px] md:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">{title}</div>

          <button
            type="button"
            onClick={onClose}
            className="text-lg text-white/60 hover:text-white"
            aria-label="Close"
          >
            x
          </button>
        </div>

        {type === 'facility' ? (
          <AddFacilityInsightForm
            location={location}
            onCancel={onClose}
            onSubmit={(payload) => {
              onSubmitFacility?.(payload)
              onClose?.()
            }}
          />
        ) : (
          <AddHousingExperienceForm
            location={location}
            onCancel={onClose}
            onSubmit={(payload) => {
              onSubmitHousing?.(payload)
              onClose?.()
            }}
          />
        )}
      </div>
    </div>
  )
}
