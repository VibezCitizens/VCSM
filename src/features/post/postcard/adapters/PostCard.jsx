// src/features/post/postcard/adapters/PostCard.jsx

import PostCardView from "../ui/PostCard.view";

export default function PostCard({
  post,
  onOpenPost,
  onReact,
  onOpenMenu, // ✅ pass-through
  onShare,    // ✅ pass-through

  // ✅ ADD: cover support
  covered = false,
  cover = null,
}) {
  if (!post) return null;

  /* ============================================================
     🔒 DOMAIN IS ALREADY NORMALIZED
     ============================================================ */
  const normalizedPost = {
    ...post,

    // ✅ actorId is the SSOT
    actor: post.actorId,

    // ✅ media already normalized upstream
    media: post.media ?? [],
  };

  return (
    <PostCardView
      post={normalizedPost}
      onOpenPost={onOpenPost}
      onReact={onReact}
      onOpenMenu={onOpenMenu} // ✅ forward to view
      onShare={onShare}       // ✅ forward to view

      // ✅ forward cover props
      covered={covered}
      cover={cover}
    />
  );
}
