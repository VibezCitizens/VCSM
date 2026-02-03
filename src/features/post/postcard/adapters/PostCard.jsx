// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\postcard\adapters\PostCard.jsx

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
  // - post.actor.id (feed normalize shape)
  // - post.actor.actorId (older domain result)
  // - post.actor_id (raw)
  const actorId =
    post.actorId ||
    post.actor?.id ||
    post.actor?.actorId ||
    post.actor_id ||
    null;

  const normalizedPost = {
    ...post,

    // ✅ what the view actually uses
    actorId,

    // ✅ keep this as-is if other components reference it
    actor: post.actor ?? actorId,

    // ✅ media normalized upstream
    media: Array.isArray(post.media) ? post.media : [],

    // ✅ preserve mentionMap for LinkifiedMentions
    mentionMap: post.mentionMap || {},
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
