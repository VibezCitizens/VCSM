import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "@/features/post/postcard/adapters/PostCard";
import { useActorPosts } from "@/features/profiles/screens/views/tabs/post/hooks/useActorPosts";

export default function ActorProfilePostsView({
  profileActorId,
  onShare,
  onOpenMenu,
  version = 0,
}) {
  const navigate = useNavigate();

  const { posts, loading, hasMore, reset, loadInitial, loadMore } = useActorPosts();

  useEffect(() => {
    if (!profileActorId) return;
    reset(profileActorId);
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileActorId, version]);

  const openPost = (postId) => {
    if (!postId) return;
    navigate(`/post/${postId}`);
  };

  if (loading && !posts.length) {
    return (
      <div className="flex items-center justify-center py-10 profiles-muted">
        Loading Vibes...
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="flex items-center justify-center py-10 profiles-muted">
        No Vibes yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onOpenPost={() => openPost(post.id)}
          onShare={onShare}
          onOpenMenu={onOpenMenu}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="profiles-pill-btn px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
