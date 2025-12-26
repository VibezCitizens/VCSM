// src/features/post/screens/PostFeed.screen.jsx
// ============================================================
// PostFeed Screen
// - Displays feed of posts
// - Read-only preview cards
// - Comments handled ONLY in PostDetail
// ============================================================

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useIdentity } from "@/state/identity/identityContext";

// Feed hook (actor-based, READ MODEL)
import { useFeed } from "@/features/feed/hooks/useFeed";

// UI
import PostCardView from "@/features/post/postcard/ui/PostCard.view";

export default function PostFeedScreen() {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const actorId = identity?.actorId ?? null;

  // ------------------------------------------------------------
  // FEED (READ MODEL ONLY)
  // ------------------------------------------------------------
  const {
    posts,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    fetchViewer,
  } = useFeed(actorId);

  // ------------------------------------------------------------
  // INITIAL LOAD / ACTOR SWITCH
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    setPosts([]);

    (async () => {
      await fetchViewer();
      if (!cancelled) {
        await fetchPosts(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorId, fetchViewer, fetchPosts, setPosts]);

  // ------------------------------------------------------------
  // INFINITE SCROLL
  // ------------------------------------------------------------
  useEffect(() => {
    if (!hasMore || loading) return;

    function onScroll() {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 600;

      if (nearBottom && !loading && hasMore) {
        fetchPosts(false);
      }
    }

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, hasMore, fetchPosts]);

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="w-full max-w-2xl mx-auto pb-24">
      {/* HEADER */}
      <div className="px-4 py-3 text-lg font-semibold">
        Feed
      </div>

      {/* EMPTY */}
      {!loading && posts.length === 0 && (
        <div className="p-6 text-center text-neutral-500">
          No posts yet.
        </div>
      )}

      {/* POSTS (READ-ONLY) */}
      {posts.map((post) => (
        <div key={`feed-post:${post.id}`} className="mb-3">
          <PostCardView
            post={post}
            onOpenPost={() => navigate(`/post/${post.id}`)}
          />
        </div>
      ))}

      {/* LOADING */}
      {loading && (
        <div className="p-6 text-center text-neutral-500">
          Loading…
        </div>
      )}

      {/* END */}
      {!hasMore && posts.length > 0 && !loading && (
        <div className="p-6 text-center text-neutral-600 text-sm">
          You reached the end.
        </div>
      )}
    </div>
  );
}
