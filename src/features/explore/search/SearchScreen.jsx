// src/features/explore/search/SearchScreen.jsx
import { useEffect, useState, useMemo } from 'react';
import SearchTabs from './components/SearchTabs';

const FILTERS = ['all', 'users', 'posts', 'videos', 'groups'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState('all');

  // Debounce input ~300ms
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const canClear = useMemo(() => query.length > 0, [query]);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="mb-4 relative">
        <label htmlFor="global-search" className="sr-only">Search</label>
        <input
          id="global-search"
          type="text"
          placeholder="Search…"
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

      <div className="flex justify-center gap-2 mb-4 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === f ? 'bg-purple-600 text-white' : 'text-gray-400'
            }`}
            aria-pressed={filter === f}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* use debounced, trimmed query */}
      <SearchTabs query={debounced} typeFilter={filter} />
    </div>
  );
}
