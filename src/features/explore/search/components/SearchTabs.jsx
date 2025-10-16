// src/features/explore/search/components/SearchTabs.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/data/data';
import { useAuth } from '@/hooks/useAuth';

export default function SearchTabs({ query, typeFilter }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Normalize items from the DAL into a single consistent shape
  const normalize = (item) => {
    if (!item) return null;
    const t = item.result_type || item.type || item.kind;

    switch (t) {
      case 'user':
        return {
          result_type: 'user',
          id: item.id ?? item.user_id ?? null,
          display_name: item.display_name ?? '',
          photo_url: item.photo_url ?? '',
          username: item.username ?? '',
        };

      case 'post':
        return {
          result_type: 'post',
          id: item.id ?? item.post_id ?? null,
          title: item.title ?? '',
          text: item.text ?? '',
        };

      case 'video':
        return {
          result_type: 'video',
          id: item.id ?? item.video_id ?? null,
          title: item.title ?? '',
        };

      case 'group':
        return {
          result_type: 'group',
          id: item.id ?? item.group_id ?? null,
          name: item.name ?? item.group_name ?? '',
          description: item.description ?? '',
        };

      case 'vport':
        return {
          result_type: 'vport',
          id: item.id ?? null,
          name: item.name ?? '',
          description: item.description ?? '',
          avatar_url: item.avatar_url ?? '',
        };

      default:
        return null;
    }
  };

  // Dedupe helper: keep the first occurrence of each `${type}:${id}`
  const dedupeByKindAndId = (arr) => {
    const map = new Map();
    for (const it of arr) {
      if (!it) continue;
      const k = `${it.result_type}:${it.id ?? 'null'}`;
      if (!map.has(k)) map.set(k, it);
    }
    return Array.from(map.values());
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const raw = (query || '').trim();
      if (!raw) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const opts = { minLength: 1, currentUserId: user?.id || undefined };

        const tasks =
          typeFilter === 'users'  ? [db.search.users(raw, opts)]  :
          typeFilter === 'posts'  ? [db.search.posts(raw, opts)]  :
          typeFilter === 'videos' ? [db.search.videos(raw, opts)] :
          typeFilter === 'groups' ? [db.search.groups(raw, opts)] :
          typeFilter === 'vports' ? [db.search.vports(raw, opts)] :
          [
            db.search.users(raw, opts),
            db.search.posts(raw, opts),
            db.search.videos(raw, opts),
            db.search.groups(raw, opts),
            db.search.vports(raw, opts),
          ];

        const settled = await Promise.allSettled(tasks);
        const flat = settled
          .filter((s) => s.status === 'fulfilled')
          .flatMap((s) => (Array.isArray(s.value) ? s.value : []))
          .map(normalize)
          .filter(Boolean);

        // ✅ Deduplicate by (result_type, id)
        const unique = dedupeByKindAndId(flat);

        if (!cancelled) setResults(unique);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Search failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [query, typeFilter, user?.id]);

  if (loading) return <div className="p-4 text-center text-white">Searching…</div>;
  if (error)   return <div className="p-4 text-center text-red-400">{error}</div>;
  if (!results.length) {
    return <div className="p-4 text-center text-neutral-400">No results found</div>;
  }

  return (
    <div className="px-4 py-2 space-y-4">
      {results.map((item, idx) => {
        // Safe key: prefer `${type}:${id}`, fall back to index if id is missing
        const safeKey = item.id != null ? `${item.result_type}:${item.id}` : `${item.result_type}#${idx}`;

        switch (item.result_type) {
          case 'user':
            return (
              <div
                key={safeKey}
                role="button"
                tabIndex={0}
                aria-label={`Open profile ${item.username || item.display_name || 'user'}`}
                onClick={() => navigate(`/u/${item.username || item.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/u/${item.username || item.id}`);
                  }
                }}
                className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition"
              >
                <img
                  src={item.photo_url || '/avatar.jpg'}
                  alt={item.display_name || item.username || 'User'}
                  loading="lazy"
                  className="w-10 h-10 object-cover rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">
                    {item.display_name || 'No Name'}
                  </span>
                  <span className="text-sm text-neutral-400">
                    {item.username}
                  </span>
                </div>
              </div>
            );

          case 'post':
            return (
              <div
                key={safeKey}
                onClick={() => navigate(`/post/${item.id}`)}
                className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-800 transition"
              >
                <div className="text-sm text-neutral-200 whitespace-pre-line">
                  {item.title ? `${item.title}\n` : ''}
                  {item.text || '(no text)'}
                </div>
              </div>
            );

          case 'video':
            return (
              <div
                key={safeKey}
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
                key={safeKey}
                onClick={() => navigate(`/groups/${item.id}`)}
                className="p-3 bg-neutral-900 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-800 transition"
              >
                <div className="text-sm text-neutral-200">{item.name}</div>
              </div>
            );

          case 'vport':
            return (
              <div
                key={safeKey}
                onClick={() => navigate(`/vport/${item.id}`)}
                className="flex items-center gap-3 p-3 bg-neutral-800 rounded-xl border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition"
              >
                <img
                  src={item.avatar_url || '/avatar.jpg'}
                  alt={item.name || 'VPORT'}
                  loading="lazy"
                  className="w-10 h-10 object-cover rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">
                    {item.name || 'Unnamed Vport'}
                  </span>
                  <span className="text-sm text-neutral-400">
                    {item.description || 'No description'}
                  </span>
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
