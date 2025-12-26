// @RefactorBatch: 2025-11
// @Touched: 2025-11-27
// @Layer: ui
// @Feature: explore
// @Owner: system
// @Note: Do NOT remove, modify, or delete this stamp.

import SearchBar from '@/features/explore/ui/SearchBar'
import FilterTabs from '@/features/explore/ui/FilterTabs'
import ExploreFeed from '@/features/explore/ui/ExploreFeed'
import ResultList from '@/features/explore/ui/ResultList'
import EmptyState from '@/features/explore/ui/EmptyState'

/**
 * ExploreView
 * ===========
 * Presentation-only view layer for Explore feature.
 *
 * DOES:
 * - Renders all Explore UI
 * - Displays content based on props
 * - Controls layout structure only
 *
 * DOES NOT:
 * - Fetch data
 * - Manage side effects
 * - Talk to APIs
 * - Own business logic
 *
 * SOURCE OF TRUTH:
 * All state is passed IN from ExploreScreen.
 */

export default function ExploreView({
  query,
  setQuery,
  activeTab,
  setActiveTab
}) {
  const isSearching = query.trim().length > 0

  return (
    <section className="flex flex-col h-full bg-black text-white">

      {/* Search input */}
      <SearchBar
        value={query}
        onChange={setQuery}
      />

      {/* Category filters */}
      <FilterTabs
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Content region */}
      <main className="flex-1 overflow-y-auto touch-pan-y">

        {/* Search mode */}
        {isSearching && (
          <ResultList
            query={query}
            filter={activeTab}
          />
        )}

        {/* Default Explore mode */}
        {!isSearching && (
          <>
            <ExploreFeed />
          </>
        )}

        {/* Empty fallback */}
        {isSearching && query.length > 2 && false && (
          <EmptyState />
        )}

      </main>

    </section>
  )
}
