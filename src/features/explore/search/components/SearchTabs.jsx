// src/features/explore/search/components/SearchTabs.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/data/data';

export default function SearchTabs({ query, typeFilter }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const navigate = useNavigate();

  // Normalize items from the DAL into a single consistent shape
  const normalize = (item) => {
    if (!item) return null;
    const t = item.result_type || item.type || item.kind;

    switch (t) {
      case 'user':
        return {
          result_type: 'user',
          id: item.id ?? item.user_id,
          username: item.username ?? '',
          display_name: item.display_name ?? '',
          photo_url: item.photo_url ?? '',
        };

      case 'post':
        return {
          result_type: 'post',
          id: item.id ?? item.post_id,
          title: item.title ?? '',
          text: item.text ?? '',
        };

      case 'video':
        return {
          result_type: 'video',
          id: item.id ?? item.video_id,
          title: item.title ?? '',
        };

      case 'group':
        return {
          result_type: 'group',
          id: item.id ?? item.group_id,
          name: item.name ?? item.group_name ?? '',
          description: item.description ?? '',
        };

      default:
        return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const raw = query?.trim() || '';
      if (!raw) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Optionally allow 1-char searches:
        const opts = { minLength: 1 };

        const tasks = [];
        if (typeFilter === 'users') {
          tasks.push(db.search.users(raw, opts));
        } else if (typeFilter === 'posts') {
          tasks.push(db.search.posts(raw, opts));
        } else if (typeFilter === 'videos') {
          tasks.push(db.search.videos(raw, opts));
        } else if (typeFilter === 'groups') {
          tasks.push(db.search.groups(raw, opts));
        } else {
          // "All"
          tasks.push(
            db.search.users(raw, opts),
            db.search.posts(raw, opts),
            db.search.videos(raw, opts),
            db.search.groups(raw, opts)
          );
        }

        const settled = await Promise.allSettled(tasks);
        const flat = settled
          .filter((s) => s.status === 'fulfilled')
          .flatMap((s) => Array.isArray(s.value) ? s.value : [])
          .map(normalize)
          .filter(Boolean);

        if (!cancelled) setResults(flat);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Search failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [query, typeFilter]);

  if (loading) return <div className="p-4 text-center text-white">Searching…</div>;
  if (error)   return <div className="p-4 text-center text-red-400">{error}</div>;
  if (!results.length)
    return <div className="p-4 text-center text-neutral-400">No results found</div>;

  return (
    <div className="px-4 py-2 space-y-4">
      {results.map((item) => {
        switch (item.result_type) {
          case 'user':
            return (
              <div
                key={`user:${item.id}`}
                onClick={() => item.username && navigate(`/u/${item.username}`)}
                className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition"
              >
                <img
                  src={item.photo_url || '/avatar.jpg'}
                  alt={item.display_name || item.username}
                  className="w-10 h-10 object-cover rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">
                    {item.display_name || 'No Name'}
                  </span>
                  <span className="text-sm text-neutral-400">
                    @{item.username}
                  </span>
                </div>
              </div>
            );

          case 'post':
            return (
              <div
                key={`post:${item.id}`}
                onClick={() => navigate(`/post/${item.id}`)}  // adjust route if needed
                className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-800 transition"
              >
                <div className="text-sm text-neutral-200 whitespace-pre-line">
                  {item.title ? `${item.title}\n` : ''}{item.text || '(no text)'}
                </div>
              </div>
            );

          case 'video':
            return (
              <div
                key={`video:${item.id}`}
                onClick={() => navigate(`/video/${item.id}`)}
                className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-800 transition"
              >
                <div className="text-sm text-neutral-200">
                  {item.title || '(untitled video)'}
                </div>
              </div>
            );

          case 'group':
            return (
              <div
                key={`group:${item.id}`}
                onClick={() => navigate(`/groups/${item.id}`)}
                className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-800 transition"
              >
                <div className="text-sm text-neutral-200">
                  {item.name}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
