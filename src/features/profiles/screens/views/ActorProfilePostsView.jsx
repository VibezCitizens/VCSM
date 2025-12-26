import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "@/features/post/postcard/adapters/PostCard";
import { useActorPosts } from "@/features/profiles/screens/views/tabs/post/hooks/useActorPosts";

export default function ActorProfilePostsView({ profileActorId }) {
  const navigate = useNavigate();

  const {
    posts,
    loading,
    hasMore,
    reset,
    loadInitial,
    loadMore,
  } = useActorPosts();

  /* ============================================================
     DEBUG — RENDER SNAPSHOT (EVERY RENDER)
     ============================================================ */
  console.group("[ActorProfilePostsView][RENDER]");
  console.log("profileActorId:", profileActorId);
  console.log("posts.length:", posts.length);
  console.log("loading:", loading);
  console.log("hasMore:", hasMore);
  console.groupEnd();

  /* ============================================================
     SCREEN LIFECYCLE (SSOT)
     ============================================================ */
  useEffect(() => {
    if (!profileActorId) {
      console.warn("[ActorProfilePostsView][EFFECT] skipped — no profileActorId");
      return;
    }

    console.group("[ActorProfilePostsView][EFFECT] reset + loadInitial");
    console.log("profileActorId:", profileActorId);
    console.groupEnd();

    reset(profileActorId);
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileActorId]);

  /* ============================================================
     DEBUG — AFTER DATA ARRIVAL
     ============================================================ */
  useEffect(() => {
    if (!posts.length) {
      console.log("[ActorProfilePostsView][POSTS EFFECT] no posts yet");
      return;
    }

    console.group("[ActorProfilePostsView][POSTS READY]");
    console.log("count:", posts.length);
    console.log("sample:", posts[0]);
    console.groupEnd();
  }, [posts]);

  /* ============================================================
     NAVIGATION HANDLER (PROFILE → POST DETAIL)
     ============================================================ */
  const openPost = (postId) => {
    if (!postId) {
      console.warn("[ActorProfilePostsView] openPost called without postId");
      return;
    }

    console.log("[ActorProfilePostsView] navigate → post detail:", postId);
    navigate(`/post/${postId}`);
  };

  /* ============================================================
     LOADING (INITIAL)
     ============================================================ */
  if (loading && !posts.length) {
    console.warn("[ActorProfilePostsView] UI → Loading state");
    return (
      <div className="flex items-center justify-center py-10 text-neutral-500">
        Loading posts…
      </div>
    );
  }

  /* ============================================================
     EMPTY STATE
     ============================================================ */
  if (!posts.length) {
    console.warn("[ActorProfilePostsView] UI → Empty state");
    return (
      <div className="flex items-center justify-center py-10 text-neutral-500">
        No posts yet.
      </div>
    );
  }

  /* ============================================================
     RENDER POSTS
     ============================================================ */
  console.log("[ActorProfilePostsView] UI → Rendering PostCards");

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onOpenPost={() => openPost(post.id)} // ✅ HERE
        />
      ))}

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              console.group("[ActorProfilePostsView][LOAD_MORE CLICK]");
              console.log("currentCount:", posts.length);
              console.groupEnd();
              loadMore();
            }}
            disabled={loading}
            className="rounded px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
