import { useState } from 'react'

export default function AddFacilityInsightForm({ location, onSubmit, onCancel }) {
  const [facilityName, setFacilityName] = useState('')
  const [unit, setUnit] = useState('')
  const [summary, setSummary] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!facilityName.trim() || !summary.trim()) return

    onSubmit?.({
      id: `facility:${Date.now()}`,
      facilityName: facilityName.trim(),
      city: `${location.city}, ${location.state}`,
      unit: unit.trim() || 'General',
      summary: summary.trim(),
      createdAtLabel: 'Just now',
    })
  }

  return (
    <form className="space-y-4 text-white" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Add hospital note</h2>
        <p className="text-sm text-white/60">
          Share nurse-to-nurse insight about hospital workflow and support quality.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Hospital name</label>
        <input
          type="text"
          value={facilityName}
          onChange={(e) => setFacilityName(e.target.value)}
          placeholder="Regional Medical Center"
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Unit</label>
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="ICU, ER, Med-Surg..."
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">What nurses should know</label>
        <textarea
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Staffing patterns, float frequency, workflow, support..."
          className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
          disabled={!facilityName.trim() || !summary.trim()}
        >
          Save hospital note
        </button>
      </div>
    </form>
  )
}
