import { useState } from 'react'

const TAGS = Object.freeze([
  'Safety',
  'Commute',
  'Noise',
  'Parking',
  'Utilities',
  'Furnished',
  'Landlord',
  'Lease Flexibility',
])

export default function AddHousingExperienceForm({ location, onSubmit, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState([])

  const toggleCategory = (tag) => {
    setCategories((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    onSubmit?.({
      id: `housing:${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      categories,
      authorLabel: 'Shared by you',
      createdAtLabel: 'Just now',
      state: location.state,
      city: location.city,
    })
  }

  return (
    <form className="space-y-4 text-white" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Add housing note</h2>
        <p className="text-sm text-white/60">
          Share what nurses should know about staying in {location.city}, {location.state}.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Headline</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quiet apartment near hospital"
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Note</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Parking, commute, safety, and lease details..."
          className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const active = categories.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleCategory(tag)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? 'border-white bg-white text-black'
                    : 'border-white/10 bg-zinc-900 text-white/80 hover:bg-white/10'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
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
          disabled={!title.trim() || !description.trim()}
        >
          Save housing note
        </button>
      </div>
    </form>
  )
}
