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

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    localStorage.setItem(LS_KEY, filter);
  }, [filter]);

  const canClear = useMemo(() => query.length > 0, [query]);

  return (
    <div className="w-full max-w-none px-0 sm:max-w-xl sm:mx-auto sm:px-4">

      {/* SEARCH BAR */}
      <div className="mb-4 relative px-4 sm:px-0">
        <input
          type="text"
          placeholder="Search users, VPORTs, posts…"
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
            className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="mb-4 flex flex-nowrap overflow-x-auto gap-2 px-4 sm:px-0 sm:flex-wrap sm:justify-center">
        {FILTERS.map((f) => {
          const selected = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                (selected
                  ? 'bg-purple-700 text-white'
                  : 'text-neutral-400 border border-neutral-700') +
                ' h-9 px-4 rounded-full text-sm whitespace-nowrap'
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          );
        })}
      </div>

      {/* RESULTS */}
      <Suspense fallback={<div className="p-4 text-center text-white">Loading…</div>}>
        <SearchTabs query={debounced} typeFilter={filter} />
      </Suspense>
    </div>
  );
}
