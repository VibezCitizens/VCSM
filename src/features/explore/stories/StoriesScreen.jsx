// src/features/explore/stories/StoriesScreen.jsx
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import StoryViewer from './StoryViewer';
import VportStoryViewer from './VportStoryViewer';

export default function StoriesScreen() {
  const [groups, setGroups] = useState([]);          // unified groups (user+vport)
  const [activeGroup, setActiveGroup] = useState(null);
  const [seenStoryIds, setSeenStoryIds] = useState(() => {
    try {
      const raw = localStorage.getItem('seenStories');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      try {
        // 1) Fetch recent user + vport stories (no fragile FK joins)
        const [u, v] = await Promise.all([
          supabase
            .from('stories')
            .select('id, user_id, media_url, media_type, caption, created_at, deleted, is_active')
            .gte('created_at', since)
            .eq('is_active', true)
            .eq('deleted', false)
            .order('created_at', { ascending: true }),

          supabase
            .from('vport_stories')
            .select('id, vport_id, created_by, media_url, media_type, caption, created_at, deleted, is_active')
            .gte('created_at', since)
            .eq('is_active', true)
            .eq('deleted', false)
            .order('created_at', { ascending: true }),
        ]);

        if (u.error) throw u.error;
        if (v.error) throw v.error;

        const userStories = u.data || [];
        const vportStories = v.data || [];

        // 2) Batch fetch authors (profiles / vports)
        const userIds = Array.from(new Set(userStories.map(s => s.user_id))).filter(Boolean);
        const vportIds = Array.from(new Set(vportStories.map(s => s.vport_id))).filter(Boolean);

        const [upro, vpro] = await Promise.all([
          userIds.length
            ? supabase.from('profiles')
                .select('id, display_name, username, photo_url')
                .in('id', userIds)
            : { data: [], error: null },
          vportIds.length
            ? supabase.from('vports')
                .select('id, name, avatar_url')
                .in('id', vportIds)
            : { data: [], error: null },
        ]);

        if (upro.error) throw upro.error;
        if (vpro.error) throw vpro.error;

        const profileMap = new Map((upro.data || []).map(p => [p.id, p]));
        const vportMap   = new Map((vpro.data || []).map(vp => [vp.id, vp]));

        // 3) Group by owner
        const map = new Map();

        userStories.forEach((s) => {
          const key = `user:${s.user_id}`;
          if (!map.has(key)) {
            map.set(key, {
              kind: 'user',
              ownerId: s.user_id,
              profile: profileMap.get(s.user_id) || null,
              items: [],
              latest: s.created_at,
            });
          }
          const g = map.get(key);
          g.items.push(s);
          if (new Date(s.created_at) > new Date(g.latest)) g.latest = s.created_at;
        });

        vportStories.forEach((s) => {
          const key = `vport:${s.vport_id}`;
          if (!map.has(key)) {
            map.set(key, {
              kind: 'vport',
              ownerId: s.vport_id,
              vport: vportMap.get(s.vport_id) || null,
              items: [],
              latest: s.created_at,
            });
          }
          const g = map.get(key);
          g.items.push(s);
          if (new Date(s.created_at) > new Date(g.latest)) g.latest = s.created_at;
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.latest) - new Date(a.latest)
        );

        setGroups(merged);
      } catch (e) {
        setErr(e?.message || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const openGroup = (g) => {
    setActiveGroup(g);
    // mark this group’s items as seen
    setSeenStoryIds((prev) => {
      const next = new Set(prev);
      g.items.forEach((s) => next.add(s.id));
      try { localStorage.setItem('seenStories', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  const tray = useMemo(
    () =>
      groups.map((g) => {
        const avatar =
          g.kind === 'user'
            ? g.profile?.photo_url || '/default.png'
            : g.vport?.avatar_url || '/default.png';

        const label =
          g.kind === 'user'
            ? (g.profile?.display_name || g.profile?.username || 'User')
            : (g.vport?.name || 'VPORT');

        const seen = g.items.every((s) => seenStoryIds.has(s.id));

        return (
          <div
            key={`${g.kind}:${g.ownerId}`}
            className="flex flex-col items-center cursor-pointer relative"
            onClick={() => openGroup(g)}
            aria-label={`Open stories from ${label}`}
          >
            <div
              className={`relative w-20 h-28 rounded-lg overflow-hidden border-2 ${
                seen ? 'border-zinc-600' : 'border-purple-500'
              }`}
            >
              <img src={avatar} alt="" className="w-full h-full object-cover" />
              {seen && <div className="absolute inset-0 bg-gray-800/50" />}
              {g.kind === 'vport' && (
                <span className="absolute top-1 right-1 text-[10px] bg-purple-600/90 px-1.5 py-0.5 rounded">
                  VPORT
                </span>
              )}
            </div>
            <p className="text-xs text-white mt-1 text-center truncate max-w-[80px]">
              {label}
            </p>
          </div>
        );
      }),
    [groups, seenStoryIds]
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white mb-4">24Drop</h1>

      {loading && (
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-20 h-28 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="mt-1 h-3 w-16 bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {err && !loading && (
        <div className="text-red-400 text-sm mb-3">{err}</div>
      )}

      {!loading && !err && (
        <>
          <div className="flex overflow-x-auto gap-4">{tray}</div>

          {activeGroup &&
            (activeGroup.kind === 'user' ? (
              <StoryViewer
                key={`u-${activeGroup.ownerId}`}
                stories={activeGroup.items}
                onClose={() => setActiveGroup(null)}
              />
            ) : (
              <VportStoryViewer
                key={`v-${activeGroup.ownerId}`}
                stories={activeGroup.items}
                onClose={() => setActiveGroup(null)}
              />
            ))}
        </>
      )}
    </div>
  );
}
