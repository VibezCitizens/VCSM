/**
 * ============================================================
 * AddHousingExperienceForm
 * ------------------------------------------------------------
 * UI-only housing experience form
 *
 * RULES:
 * - UI-only
 * - No submit logic yet
 * ============================================================
 */

import { useState } from 'react'

export default function AddHousingExperienceForm({ location }) {
  const [tags, setTags] = useState([])

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const TAGS = [
    'Safety',
    'Commute',
    'Noise',
    'Parking',
    'Utilities',
    'Furnished',
    'Landlord',
    'Lease Flexibility',
  ]

  return (
    <form className="space-y-6 text-white">
      {/* ================= INTRO ================= */}
      <div className="space-y-1">
        <h2 className="text-base font-semibold">
          Share a Housing Experience
        </h2>
        <p className="text-sm text-white/60">
          Help other travel nurses by sharing what it was really like to stay there.
        </p>
      </div>

      {/* ================= LOCATION ================= */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Location
        </label>
        <div className="rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm">
          {location.city}, {location.state}
        </div>
      </div>

      {/* ================= PLACE NAME ================= */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Place name
        </label>
        <input
          type="text"
          placeholder="e.g. Motel 22 Studio"
          className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
      </div>

      {/* ================= HOUSING TYPE ================= */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Housing type
        </label>
        <select className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white">
          <option value="">Select type</option>
          <option>Hotel</option>
          <option>Apartment</option>
          <option>House</option>
          <option>Room</option>
          <option>Extended Stay</option>
        </select>
      </div>

      {/* ================= ZIP ================= */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          ZIP code <span className="text-white/40"></span>
        </label>
        <input
          type="text"
          placeholder="ZIP Code"
          className="w-32 rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
      </div>

      {/* ================= HEADLINE ================= */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Short headline
        </label>
        <input
          type="text"
          placeholder="e.g. Decent option for short contracts"
          className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
      </div>

      {/* ================= EXPERIENCE ================= */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Your experience
        </label>
        <textarea
          rows={4}
          placeholder="What should other nurses know?"
          className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 resize-none"
        />
      </div>

      {/* ================= TAGS ================= */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          What stood out?
        </label>

        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const active = tags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`
                  px-3 py-1 rounded-full text-xs
                  border transition
                  ${
                    active
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900 text-white/80 border-white/10 hover:bg-white/10'
                  }
                `}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* ================= SUBMIT ================= */}
      <button
        type="button"
        disabled
        className="
          w-full
          rounded-xl
          bg-zinc-700
          py-3
          text-sm
          text-white/70
          cursor-not-allowed
        "
      >
        Submit housing experience (coming soon)
      </button>
    </form>
  )
}
