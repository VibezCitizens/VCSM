// src/features/explore/search/SearchScreen.jsx
import { useEffect, useState, useMemo, Suspense } from 'react';
import SearchTabs from './components/SearchTabs';

const FILTERS = ['all', 'users', 'vports', 'posts', 'videos', 'groups'];
const LS_KEY = 'search:lastFilter';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return FILTERS.includes(saved) ? saved : 'all';
  });

  // debounce query
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  // persist last filter
  useEffect(() => {
    localStorage.setItem(LS_KEY, filter);
  }, [filter]);

  const canClear = useMemo(() => query.length > 0, [query]);

  return (
    <div className="w-full max-w-none px-0 sm:max-w-xl sm:mx-auto sm:px-4">
      {/* Search input (edge-to-edge on mobile) */}
      <div className="mb-4 relative px-4 sm:px-0">
        <label htmlFor="global-search" className="sr-only">
          Search
        </label>
        <input
          id="global-search"
          type="text"
          placeholder="Search users, VPORTs, posts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 pr-10 rounded-full bg-neutral-900 text-white border border-purple-600 focus:outline-none"
          autoComplete="off"
          inputMode="search"
        />
        {canClear && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-6 sm:right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            aria-label="Clear search"
            title="Clear"
          >
            ×
          </button>
        )}
      </div>

      {/* Tabs: single row scroll on mobile; centered wrap on ≥sm */}
      <div role="tablist" aria-label="Search filters" className="mb-4">
        <div
          className="
            flex flex-nowrap overflow-x-auto no-scrollbar gap-2 px-4 sm:px-0
            sm:flex-wrap sm:overflow-visible sm:justify-center
          "
        >
          {FILTERS.map((f) => {
            const selected = filter === f;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={selected}
                aria-controls={`results-panel-${f}`}
                id={`tab-${f}`}
                onClick={() => setFilter(f)}
                className={
                  (selected ? 'bg-purple-600 text-white' : 'text-gray-400') +
                  ' h-9 px-3 rounded-full text-sm whitespace-nowrap shrink-0'
                }
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div
        role="tabpanel"
        id={`results-panel-${filter}`}
        aria-labelledby={`tab-${filter}`}
      >
        <Suspense fallback={<div className="p-4 text-center text-white">Loading…</div>}>
          <SearchTabs query={debounced} typeFilter={filter} />
        </Suspense>
      </div>
    </div>
  );
}
