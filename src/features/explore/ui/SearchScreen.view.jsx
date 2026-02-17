// src/features/explore/ui/SearchScreen.view.jsx

import React, { Suspense } from 'react'
import { useSearchActor } from '../hooks/useSearchActor'
import ResultList from './ResultList'

export default function SearchScreen() {
  const {
    query,
    filter,
    debounced,
    canClear,
    setQuery,
    setFilter,
  } = useSearchActor()

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'users', label: 'Citizens' },
    { key: 'vports', label: 'Vports' },
    { key: 'posts', label: 'Vibes' }, // ✅ Posts → Vibes (UI label)
    { key: 'groups', label: 'Groups' },
  ]

  return (
    <div
      className="
        w-full
        px-4
        pt-[calc(env(safe-area-inset-top)+12px)]
      "
    >
      {/* ================= SEARCH INPUT ================= */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search Citizens, Vports, Vibes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="
            w-full px-4 py-2 pr-10
            rounded-2xl bg-neutral-900 text-white
            border border-purple-700
            focus:ring-2 focus:ring-purple-500
          "
        />

        {canClear && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {/* ================= FILTER TABS (PROFILE STYLE) ================= */}
      <div className="mb-6">
        <div className="flex justify-center gap-10 border-b border-white/15">
          {FILTERS.map((f) => {
            const active = filter === f.key

            return (
              <button
                type="button"
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`
                  relative py-3
                  text-[18px] tracking-wide
                  transition-colors duration-200
                  ${
                    active
                      ? 'text-white font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }
                `}
              >
                {f.label}

                {active && (
                  <span
                    className="
                      absolute left-0 right-0 -bottom-[1px]
                      h-[2px] bg-white/90 rounded-full
                    "
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ================= RESULTS ================= */}
      <Suspense fallback={<div className="text-center">Loading…</div>}>
        <ResultList query={debounced} filter={filter} />
      </Suspense>
    </div>
  )
}
