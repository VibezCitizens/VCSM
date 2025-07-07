import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SearchTabs({ query, typeFilter }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const tabMap = {
    all: null,
    users: 'user',
    posts: 'post',
    videos: 'video',
    groups: 'group',
  };

  useEffect(() => {
    const search = async () => {
      if (!query?.trim()) return;
      setLoading(true);

      const { data, error } = await supabase.rpc('global_search', {
        query_input: query,
        type_filter: tabMap[typeFilter?.toLowerCase()] ?? null,
      });

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults(data || []);
      }

      setLoading(false);
    };

    search();
  }, [query, typeFilter]);

  if (loading) return <div className="p-4 text-center text-white">Searching...</div>;
  if (!results.length) return <div className="p-4 text-center text-neutral-400">No results found</div>;

  return (
    <div className="px-4 py-2 space-y-4">
      {results.map((item, index) => {
        if (item.result_type === 'user') {
          return (
            <div
              key={item.user_id || index}
              onClick={() => {
                if (item.username) navigate(`/u/${item.username}`);
              }}
              className="flex items-center gap-3 p-3 bg-neutral-800 dark:bg-neutral-900 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition"
            >
              <img
                src={item.photo_url || '/default-avatar.png'}
                alt={item.display_name || item.username || 'user'}
                className="w-10 h-10 object-cover rounded"
              />
              <div className="flex flex-col">
                <span className="text-white font-semibold">{item.display_name || 'No Name'}</span>
                <span className="text-sm text-neutral-400">@{item.username || 'unknown'}</span>
              </div>
            </div>
          );
        }

        if (item.result_type === 'post') {
          return (
            <div
              key={item.user_id + item.display_name}
              className="p-3 bg-neutral-900 rounded-xl border border-neutral-700"
            >
              <div className="text-sm text-neutral-200 whitespace-pre-line">
                {item.display_name}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
