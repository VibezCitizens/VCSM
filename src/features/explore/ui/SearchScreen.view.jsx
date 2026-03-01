import React, { Suspense } from 'react'
import { Search, X } from 'lucide-react'
import { useSearchActor } from '../hooks/useSearchActor'
import ResultList from './ResultList'
import ExploreFeed from './ExploreFeed'

export default function SearchScreen() {
  const { query, filter, debounced, canClear, setQuery, setFilter } = useSearchActor()
  const isSearching = query.trim().length > 0 || debounced.trim().length > 0

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'users', label: 'Citizens' },
    { key: 'vports', label: 'Vports' },
    { key: 'posts', label: 'Vibes' },
    { key: 'groups', label: 'Groups' },
  ]

  return (
    <div className="w-full px-2 pt-2 pb-2 sm:px-4 sm:pb-3">
      <div className="relative mb-3 rounded-2xl border border-slate-300/15 bg-slate-950/38 backdrop-blur-xl">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />

        <input
          type="text"
          placeholder="Search citizens, vports, vibes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-transparent bg-transparent py-3 pl-10 pr-10 text-[17px] text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
        />

        {canClear && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-100"
            aria-label="Clear"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="mb-2 p-1">
        <div className="grid grid-cols-5 gap-1">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                type="button"
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`relative flex items-center justify-center py-2 text-center text-[14px] tracking-wide transition-colors duration-200 ${
                  active
                    ? 'font-semibold text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
                {active && (
                  <span className="absolute left-3 right-3 -bottom-[1px] h-[2px] rounded-full bg-indigo-300/85" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {isSearching ? (
        <Suspense fallback={<div className="text-center text-slate-300">Loading...</div>}>
          <ResultList query={debounced || query} filter={filter} />
        </Suspense>
      ) : (
        <ExploreFeed filter={filter} />
      )}
    </div>
  )
}
