export default function HousingEmptyState() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center">
      <div className="text-sm font-semibold text-white">No housing notes yet</div>
      <p className="mt-1 text-sm text-white/60">
        Verified nurses have not shared housing notes for this city yet.
      </p>
      <p className="mt-3 text-xs text-white/40">
        Tap + to add the first housing note.
      </p>
    </div>
  )
}
