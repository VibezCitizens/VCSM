import { useNavigate } from "react-router-dom";
import PostCard from "@/features/post/adapters/postCard.adapter";
import { useActorPosts } from "@/features/profiles/screens/views/tabs/post/hooks/useActorPosts";

function VibesTabSkeleton({ count = 2 }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => {
        const withMedia = index % 2 === 1;

        return (
          <div
            key={`vibes-skeleton:${index}`}
            className="post-modern post-card profiles-card w-full overflow-hidden rounded-2xl"
          >
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-white/8" />
                  <div className="min-w-0 space-y-2">
                    <div className="h-3.5 w-28 animate-pulse rounded bg-white/8" />
                    <div className="h-2.5 w-40 animate-pulse rounded bg-white/6" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
                <div className="h-4 w-4 animate-pulse rounded bg-white/6" />
              </div>
            </div>

            <div className="px-4 pb-3 space-y-2">
              <div className="h-3.5 w-11/12 animate-pulse rounded bg-white/8" />
              <div className="h-3.5 w-7/12 animate-pulse rounded bg-white/5" />
            </div>

            {withMedia ? (
              <div className="mb-2 h-48 w-full animate-pulse bg-white/5" />
            ) : null}

            <div className="px-4 pb-3">
              <div className="flex items-center gap-5">
                {Array.from({ length: 5 }).map((_, reactionIndex) => (
                  <div
                    key={`vibes-skeleton-reaction:${index}:${reactionIndex}`}
                    className="h-5 w-10 animate-pulse rounded bg-white/5"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ActorProfilePostsView({
  profileActorId,
  canViewContent,
  onShare,
  onOpenMenu,
}) {
  const navigate = useNavigate();
  const { posts, loading, hasMore, loadMore, loadingMore } = useActorPosts(profileActorId, canViewContent);

  const openPost = (postId) => {
    if (!postId) return;
    navigate(`/post/${postId}`);
  };

  if (loading && !posts.length) {
    return (
      <>
        <span className="sr-only">Loading Vibes...</span>
        <VibesTabSkeleton count={2} />
      </>
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
            disabled={loadingMore}
            className="profiles-pill-btn px-4 py-2 text-sm disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
