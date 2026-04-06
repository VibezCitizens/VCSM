// Routing-level screen
// Decides which nurse experience to render

import NurseHomeScreenView from './NurseHomeScreenView'

export default function NurseHomeScreen({ profession = 'nurse' }) {
  if (profession !== 'nurse') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-white">
        <div className="text-base font-semibold">Nurse-only workspace</div>
        <p className="mt-1 text-sm text-white/70">
          Housing and facility reviews are visible only to verified nurses.
        </p>
      </div>
    )
  }

  return <NurseHomeScreenView />
}
