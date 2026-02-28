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
    <div className="module-modern-shell w-full rounded-none border-x-0 border-t-0 px-2 pt-2 pb-2 sm:rounded-2xl sm:border sm:px-4 sm:pb-3">
      <div className="module-modern-search-shell relative mb-2">
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
          className="module-modern-input w-full rounded-[14px] py-3 pl-10 pr-10 text-[17px]"
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

      <div className="mb-2 border-b border-slate-300/15">
        <div className="grid grid-cols-5 gap-0.5">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                type="button"
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`relative flex items-center justify-center py-2 text-center text-[15px] tracking-wide transition-colors duration-200 ${
                  active ? 'font-semibold text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
                {active && (
                  <span className="absolute left-2 right-2 -bottom-[1px] h-[2px] rounded-full bg-indigo-300/90" />
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
        <ExploreFeed />
      )}
    </div>
  )
}
