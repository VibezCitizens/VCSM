// CentralFeed.jsx (JSX-safe)
import { useEffect, useRef, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PostCard from '@/features/posts/components/PostCard';
import { useFeed } from '@/features/feed/useFeed';

export default function CentralFeed() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const {
    posts, profiles, vports, viewerIsAdult, loading, hasMore, fetchPosts, setPosts,
  } = useFeed(user.id);

  // ✅ no TS generics in JSX files
  const listRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => { fetchPosts(true); /* fresh */ }, [user?.id]); // eslint-disable-line

  const observeMore = useCallback(() => {
    const rootEl = listRef.current;
    const sentinel = sentinelRef.current;
    if (!rootEl || !sentinel) return () => {};

    let ticking = false;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasMore && !loading && !ticking) {
          ticking = true;
          fetchPosts(false).finally(() => { ticking = false; });
        }
      },
      { root: rootEl, rootMargin: '0px 0px 600px 0px', threshold: 0.01 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, loading, fetchPosts]);

  useEffect(() => observeMore(), [observeMore]);

  return (
    <div ref={listRef} className="h-screen overflow-y-auto px-0 py-4 space-y-2 scroll-hidden">
      {viewerIsAdult === null && <p className="text-center text-gray-400">Loading your feed…</p>}
      {viewerIsAdult !== null && !loading && posts.length === 0 && (
        <p className="text-center text-gray-400">No posts found.</p>
      )}
      {posts.map((item) => {
        const authorObj = item.type === 'user' ? (profiles[item.authorId] || null) : (vports[item.authorId] || null);
        return (
          <PostCard
            key={`${item.type}:${item.id}`}
            post={item}
            user={authorObj}
            authorType={item.type}
            onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
          />
        );
      })}
      {loading && posts.length === 0 && (
        <div className="space-y-4">{[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-neutral-800 h-40 rounded-xl" />
        ))}</div>
      )}
      {loading && posts.length > 0 && <p className="text-center text-white">Loading more...</p>}
      {!hasMore && !loading && posts.length > 0 && <p className="text-center text-gray-400">End of feed</p>}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
