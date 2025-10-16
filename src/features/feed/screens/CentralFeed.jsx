// src/features/feed/screens/centralfeed.jsx
import { useEffect, useRef, useCallback, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PostCard from '@/features/post/components/PostCard';
import { useFeed } from '@/features/feed/useFeed';
import PullToRefresh from '@/components/PullToRefresh';

// Actor store (persisted across refresh)
import { getActor, onActorChange } from '@/lib/actors/actor';

export default function CentralFeed() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

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
    // one more pull if first snapshot was null
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

  // IMPORTANT: call hooks unconditionally (no early returns before this)
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

  // Infinite scroll observer
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

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    ptrRef.current?.scrollTo?.({ top: 0, behavior: 'auto' });
    setPosts([]);
    await fetchViewer?.();
    await fetchPosts(true);
  }, [setPosts, fetchViewer, fetchPosts]);

  // ----- RENDER -----
  // While actor store hydrates (or during tiny grace), show a lightweight loader.
  // Note: we did NOT skip any hooks; this is just a conditional render.
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
      {/* Initial loading state */}
      {viewerIsAdult === null && (
        <p className="text-center text-gray-400">Loading your feed…</p>
      )}

      {/* Empty state */}
      {viewerIsAdult !== null && !loading && posts.length === 0 && (
        <p className="text-center text-gray-400">No posts found.</p>
      )}

      {/* Feed items */}
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

      {/* Loading states */}
      {loading && posts.length === 0 && (
        <div className="space-y-3 px-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-neutral-800 h-40 rounded-xl"
            />
          ))}
        </div>
      )}

      {loading && posts.length > 0 && (
        <p className="text-center text-white">Loading more...</p>
      )}

      {/* End of list */}
      {!hasMore && !loading && posts.length > 0 && (
        <p className="text-center text-gray-400">End of feed</p>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />
    </PullToRefresh>
  );
}
