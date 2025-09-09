// src/features/explore/search/SearchScreen.jsx
import { useEffect, useState, useMemo } from 'react';
import SearchTabs from './components/SearchTabs';

// Add 'vports' so the UI shows a dedicated tab
const FILTERS = ['all', 'users', 'vports', 'posts', 'videos', 'groups'];
const LS_KEY = 'search:lastFilter';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState(() => {
    // restore last chosen tab if present
    const saved = localStorage.getItem(LS_KEY);
    return FILTERS.includes(saved) ? saved : 'all';
  });

  // Debounce input ~300ms
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  // Persist tab choice
  useEffect(() => {
    localStorage.setItem(LS_KEY, filter);
  }, [filter]);

  const canClear = useMemo(() => query.length > 0, [query]);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="mb-4 relative">
        <label htmlFor="global-search" className="sr-only">Search</label>
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
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            aria-label="Clear search"
            title="Clear"
          >
            ×
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Search filters"
        className="flex justify-center gap-2 mb-4 overflow-x-auto"
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
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selected ? 'bg-purple-600 text-white' : 'text-gray-400'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`results-panel-${filter}`}
        aria-labelledby={`tab-${filter}`}
      >
        <SearchTabs query={debounced} typeFilter={filter} />
      </div>
    </div>
  );
}
