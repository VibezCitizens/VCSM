import React, { Suspense } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from '@i18n'
import { useSearchActor } from '../hooks/useSearchActor'
import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter'
import ResultList from './ResultList'
import ExploreFeed from './ExploreFeed'
import '@/features/explore/styles/explore-modern.css'

const FILTER_KEYS = [
  { key: 'all', tKey: 'explore.filterAll' },
  { key: 'users', tKey: 'explore.filterCitizens' },
  { key: 'vports', tKey: 'explore.filterVports' },
  { key: 'posts', tKey: 'explore.filterVibes' },
  { key: 'groups', tKey: 'explore.filterDistricts' },
]

export default function SearchScreen() {
  const { t } = useTranslation()
  const { query, filter, debounced, canClear, setQuery, setFilter } = useSearchActor()
  const isSearching = query.trim().length > 0 || debounced.trim().length > 0

  const FILTERS = FILTER_KEYS.map(({ key, tKey }) => ({ key, label: t(tKey) }))

  return (
    <div className="explore-modern w-full flex flex-col flex-1 min-h-0">

      {/* Sticky header — never scrolls */}
      <div className="flex-shrink-0 px-2 pt-2">
        <div className="explore-search-shell">
          <div className="explore-search-input-wrap relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50"
              aria-hidden="true"
            />

            <input
              type="text"
              placeholder={t('explore.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="explore-search-input"
            />

            {canClear && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/50 transition hover:bg-white/6/60 hover:text-white"
                aria-label={t('explore.clearSearch')}
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
      </div>

      {/* Scrollable body — fills remaining height */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-2 pt-2"
        style={{ paddingBottom: 'calc(var(--vc-bottom-nav-total-height, 3.75rem) + 0.75rem)' }}
      >
        {isSearching ? (
          <Suspense fallback={<div className="text-center text-white/70">{t('explore.loading')}</div>}>
            <ResultList query={debounced || query} filter={filter} />
          </Suspense>
        ) : (
          <>
            <OnboardingCardsView />
            <ExploreFeed filter={filter} />
          </>
        )}
      </div>

    </div>
  )
}
