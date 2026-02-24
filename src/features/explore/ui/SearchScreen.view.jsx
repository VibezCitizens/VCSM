import React, { Suspense } from 'react'
import { useSearchActor } from '../hooks/useSearchActor'
import ResultList from './ResultList'

export default function SearchScreen() {
  const { query, filter, debounced, canClear, setQuery, setFilter } = useSearchActor()

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'users', label: 'Citizens' },
    { key: 'vports', label: 'Vports' },
    { key: 'posts', label: 'Vibes' },
    { key: 'groups', label: 'Groups' },
  ]

  return (
    <div className="module-modern-shell w-full rounded-2xl px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4">
      <div className="relative mb-3 sm:mb-4">
        <input
          type="text"
          placeholder="Search Citizens, Vports, Vibes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="module-modern-input w-full rounded-2xl px-4 py-2 pr-10"
        />

        {canClear && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            aria-label="Clear"
          >
            x
          </button>
        )}
      </div>

      <div className="mb-4 overflow-x-auto sm:mb-5">
        <div className="flex min-w-max justify-center gap-6 border-b border-slate-300/15 px-1 sm:gap-8 sm:px-2">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                type="button"
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`relative py-2 text-[17px] tracking-wide transition-colors duration-200 sm:py-3 ${
                  active ? 'font-semibold text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] rounded-full bg-indigo-300/90" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <Suspense fallback={<div className="text-center text-slate-300">Loading...</div>}>
        <ResultList query={debounced} filter={filter} />
      </Suspense>
    </div>
  )
}
