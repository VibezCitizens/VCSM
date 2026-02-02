// src/features/post/postcard/adapters/PostCard.jsx

import PostCardView from "../ui/PostCard.view";

export default function PostCard({
  post,
  onOpenPost,
  onReact,
  onOpenMenu,
  onShare,

  covered = false,
  cover = null,
}) {
  if (!post) return null;

  // ✅ support both shapes:
  // - post.actorId (new)
  // - post.actor.actorId (older domain result)
  const actorId =
    post.actorId ||
    post.actor?.actorId ||
    post.actor_id || // (if a raw row leaks in)
    null;

  const normalizedPost = {
    ...post,

    // ✅ what the view actually uses
    actorId,

    // ✅ keep these if other components still reference them
    actor: post.actor ?? actorId,

    // ✅ media normalized upstream
    media: Array.isArray(post.media) ? post.media : [],
  };

  return (
    <PostCardView
      post={normalizedPost}
      onOpenPost={onOpenPost}
      onReact={onReact}
      onOpenMenu={onOpenMenu}
      onShare={onShare}
      covered={covered}
      cover={cover}
    />
  );
}
