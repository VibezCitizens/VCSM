import React, { Suspense } from 'react'
import { Search, X } from 'lucide-react'
import { useSearchActor } from '../hooks/useSearchActor'
import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter'
import ResultList from './ResultList'
import ExploreFeed from './ExploreFeed'
import '@/features/explore/styles/explore-modern.css'

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
    <div className="explore-modern w-full px-2 pt-2 pb-2 sm:px-4 sm:pb-3">
      <div className="explore-search-shell">
      <div className="explore-search-input-wrap relative">
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
          className="explore-search-input"
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

      <div className="explore-filter-wrap mb-2">
        <div className="explore-filter-grid">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                type="button"
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`explore-filter-btn ${active ? 'is-active' : ''}`}
              >
                {f.label}
                {active && (
                  <span className="explore-filter-indicator" />
                )}
              </button>
            )
          })}
        </div>
      </div>
      </div>

      {isSearching ? (
        <Suspense fallback={<div className="text-center text-slate-300">Loading...</div>}>
          <ResultList query={debounced || query} filter={filter} />
        </Suspense>
      ) : (
        <>
          <OnboardingCardsView />
          <ExploreFeed filter={filter} />
        </>
      )}
    </div>
  )
}
