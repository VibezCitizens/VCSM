/**
 * Build photo reaction metadata for profile photo posts.
 */
export function enrichPhotoPostsModel({
  posts = [],
  reactions = [],
  commentCounts = {},
  roseCounts = {},
  viewerActorId,
}) {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  const reactionMap = new Map();
  for (const r of reactions) {
    if (!r?.post_id) continue;
    let entry = reactionMap.get(r.post_id);
    if (!entry) {
      entry = { like: 0, dislike: 0, viewer: null };
      reactionMap.set(r.post_id, entry);
    }
    if (r.reaction === "like") entry.like += 1;
    else if (r.reaction === "dislike") entry.dislike += 1;
    if (viewerActorId && r.actor_id === viewerActorId) entry.viewer = r.reaction ?? null;
  }

  return posts.map((post) => {
    const entry = reactionMap.get(post.id) ?? { like: 0, dislike: 0, viewer: null };
    return {
      ...post,
      likeCount: entry.like,
      dislikeCount: entry.dislike,
      roseCount: roseCounts[post.id] || 0,
      commentCount: commentCounts[post.id] || 0,
      userHasReacted: entry.viewer,
    };
  });
}
