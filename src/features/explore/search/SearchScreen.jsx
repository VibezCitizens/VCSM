import { useState } from 'react';
import SearchTabs from './components/SearchTabs';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const filters = ['all', 'users', 'posts', 'videos', 'groups'];

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-full bg-neutral-900 text-white border border-purple-600 focus:outline-none"
        />
      </div>

      <div className="flex justify-center gap-4 mb-4 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === f ? 'bg-purple-600 text-white' : 'text-gray-400'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <SearchTabs query={query.trim()} typeFilter={filter} />
    </div>
  );
}
