// src/features/feed/screens/centralfeed.jsx
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PostCard from '@/features/post/components/PostCard';
import { useFeed } from '@/features/feed/useFeed';
import PullToRefresh from '@/components/PullToRefresh';
import { getActor, onActorChange } from '@/lib/actors/actor';
import supabase from '@/lib/supabaseClient';

// ------------------ Privacy Debugger ------------------
function DebugPrivacyPanel({ userId, posts }) {
  const [rows, setRows] = useState([]);
  const postIds = useMemo(() => posts.map(p => p.id), [posts]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId || postIds.length === 0) { setRows([]); return; }

      try {
        // 1) map post -> actor_id
        const { data: postActors, error: pErr } = await supabase
          .schema('vc')
          .from('posts')
          .select('id, actor_id')
          .in('id', postIds);
        if (pErr) throw pErr;

        const actorIds = [...new Set((postActors || []).map(x => x.actor_id).filter(Boolean))];

        // 2) actors -> profile_id / vport_id
        const { data: actors, error: aErr } = await supabase
          .schema('vc')
          .from('actors')
          .select('id, profile_id, vport_id')
          .in('id', actorIds);
        if (aErr) throw aErr;

        const profileIds = [...new Set((actors || []).map(a => a.profile_id).filter(Boolean))];

        // 3) user privacy (vc.user_profiles view)
        const { data: userProfiles, error: upErr } = await supabase
          .schema('vc')
          .from('user_profiles')
          .select('id, private')
          .in('id', profileIds);
        if (upErr) throw upErr;

        const upMap = (userProfiles || []).reduce((m, r) => { m[r.id] = r; return m; }, {});
        const actorMap = (actors || []).reduce((m, a) => { m[a.id] = a; return m; }, {});

        // 4) my owned actors
        const { data: mine, error: mErr } = await supabase
          .schema('vc')
          .from('actor_owners')
          .select('actor_id')
          .eq('user_id', userId);
        if (mErr) throw mErr;

        const myActorIds = new Set((mine || []).map(r => r.actor_id));

        // 5) follow edges: (myActorIds) -> authorActorId
        const { data: follows, error: fErr } = await supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id, followed_actor_id, is_active')
          .in('follower_actor_id', Array.from(myActorIds))
          .in('followed_actor_id', actorIds);
        if (fErr) throw fErr;

        const followSet = new Set(
          (follows || [])
            .filter(f => f.is_active)
            .map(f => `${f.follower_actor_id}->${f.followed_actor_id}`)
        );

        // Build debug rows aligned to posts
        const enriched = (postActors || []).map(pa => {
          const a = actorMap[pa.actor_id] || null;
          const isVport = !!a?.vport_id;
          const isOwner = a?.profile_id === userId;
          const isPublic = a?.profile_id ? (upMap[a.profile_id]?.private === false) : false;

          // any of my actors follows author?
          let isFollower = false;
          if (a && !isVport) {
            for (const my of myActorIds) {
              if (followSet.has(`${my}->${a.id}`)) { isFollower = true; break; }
            }
          }

          const visibleByPolicy = isVport || isOwner || isPublic || isFollower;

          return {
            post_id: pa.id,
            actor_id: pa.actor_id,
            profile_id: a?.profile_id || null,
            vport_id: a?.vport_id || null,
            isVport, isOwner, isPublic, isFollower, visibleByPolicy,
          };
        });

        if (!cancelled) {
          setRows(enriched);

          // Verbose console log for deep dive
          console.groupCollapsed('%c[Privacy Debug] Feed visibility breakdown', 'color:#a78bfa');
          enriched.forEach(r => {
            console.log({
              post_id: r.post_id,
              actor_id: r.actor_id,
              profile_id: r.profile_id,
              vport_id: r.vport_id,
              flags: {
                isVport: r.isVport,
                isOwner: r.isOwner,
                isPublic: r.isPublic,
                isFollower: r.isFollower,
                visibleByPolicy: r.visibleByPolicy,
              },
            });
          });
          console.groupEnd();
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[Privacy Debug] error:', e);
          setRows([{ error: e?.message || String(e) }]);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [userId, postIds.join('|')]);

  if (!rows.length) return null;

  return (
    <div className="mt-3 mx-3 rounded-xl border border-fuchsia-500/40 bg-fuchsia-900/10 p-2">
      <div className="text-xs font-semibold text-fuchsia-300 mb-2">
        Privacy Debug (client-side view of why each post is visible)
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="text-fuchsia-300/90">
            <tr>
              <th className="text-left pr-3 py-1">post_id</th>
              <th className="text-left pr-3 py-1">actor_id</th>
              <th className="text-left pr-3 py-1">profile_id</th>
              <th className="text-left pr-3 py-1">vport_id</th>
              <th className="text-left pr-3 py-1">isVport</th>
              <th className="text-left pr-3 py-1">isOwner</th>
              <th className="text-left pr-3 py-1">isPublic</th>
              <th className="text-left pr-3 py-1">isFollower</th>
              <th className="text-left pr-3 py-1">visibleByPolicy</th>
            </tr>
          </thead>
          <tbody className="text-fuchsia-100/90">
            {rows.map((r) => (
              <tr key={r.post_id}>
                <td className="pr-3 py-1">{r.post_id}</td>
                <td className="pr-3 py-1">{r.actor_id}</td>
                <td className="pr-3 py-1">{r.profile_id ?? '—'}</td>
                <td className="pr-3 py-1">{r.vport_id ?? '—'}</td>
                <td className="pr-3 py-1">{String(r.isVport)}</td>
                <td className="pr-3 py-1">{String(r.isOwner)}</td>
                <td className="pr-3 py-1">{String(r.isPublic)}</td>
                <td className="pr-3 py-1">{String(r.isFollower)}</td>
                <td className="pr-3 py-1 font-semibold">{String(r.visibleByPolicy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-fuchsia-300/80 mt-2">
        Tip: open the console — you’ll see a grouped log per post with the same flags.
      </p>
    </div>
  );
}
// ------------------------------------------------------

export default function CentralFeed() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const [search] = useSearchParams();
  const debugPrivacy = (search.get('debug') || '').toLowerCase() === 'privacy';

  // --- Actor hydration (keeps VPORT across hard refresh) ---
  const [actor, setActor] = useState(() => {
    try { return getActor(); } catch { return null; }
  });
  const [hydrated, setHydrated] = useState(!!actor);
  const [grace, setGrace] = useState(true);

  useEffect(() => {
    const unsub = onActorChange((a) => {
      setActor(a);
      if (!hydrated) setHydrated(true);
    });
    if (!actor) {
      try {
        const a = getActor();
        if (a) { setActor(a); setHydrated(true); }
      } catch {}
    }
    const t = setTimeout(() => setGrace(false), 200);
    return () => { unsub?.(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ---------------------------------------------------------

  const {
    posts,
    profiles,
    vports,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    fetchViewer,
  } = useFeed(user.id);

  const ptrRef = useRef(null);
  const sentinelRef = useRef(null);

  // Load viewer + first page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchViewer();
      if (cancelled) return;
      await fetchPosts(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Infinite scroll watcher
  const observeMore = useCallback(() => {
    const rootEl = ptrRef.current;
    const sentinel = sentinelRef.current;
    if (!rootEl || !sentinel) return () => {};

    let locked = false;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasMore && !loading && !locked) {
          locked = true;
          fetchPosts(false).finally(() => { locked = false; });
        }
      },
      { root: rootEl, rootMargin: '0px 0px 600px 0px', threshold: 0.01 }
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, loading, fetchPosts]);

  useEffect(() => observeMore(), [observeMore]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    ptrRef.current?.scrollTo?.({ top: 0, behavior: 'auto' });
    setPosts([]);
    await fetchViewer?.();
    await fetchPosts(true);
  }, [setPosts, fetchViewer, fetchPosts]);

  // ----- RENDER -----
  if (!hydrated || grace) {
    return (
      <div className="h-screen overflow-y-auto bg-black text-white px-0 py-2">
        <p className="text-center text-gray-400 mt-6">Loading your feed…</p>
      </div>
    );
  }

  return (
    <PullToRefresh
      ref={ptrRef}
      onRefresh={handleRefresh}
      threshold={70}
      maxPull={120}
      className="h-screen overflow-y-auto bg-black text-white px-0 py-2"
    >
      {viewerIsAdult === null && (
        <p className="text-center text-gray-400">Loading your feed…</p>
      )}

      {viewerIsAdult !== null && !loading && posts.length === 0 && (
        <p className="text-center text-gray-400">No posts found.</p>
      )}

      {posts.map((item) => {
        const authorObj =
          item.type === 'user'
            ? profiles[item.authorId] || null
            : vports[item.authorId] || null;

        return (
          <div key={`post:${item.id}`} className="mb-2 last:mb-0">
            <PostCard
              post={item}
              user={authorObj}
              authorType={item.type}
              onDelete={(id) =>
                setPosts((prev) => prev.filter((p) => p.id !== id))
              }
            />
          </div>
        );
      })}

      {debugPrivacy && <DebugPrivacyPanel userId={user.id} posts={posts} />}

      {loading && posts.length === 0 && (
        <div className="space-y-3 px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral-800 h-40 rounded-xl" />
          ))}
        </div>
      )}

      {loading && posts.length > 0 && (
        <p className="text-center text-white">Loading more...</p>
      )}

      {!hasMore && !loading && posts.length > 0 && (
        <p className="text-center text-gray-400">End of feed</p>
      )}

      <div ref={sentinelRef} className="h-1" />
    </PullToRefresh>
  );
}
