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

  return posts.map((post) => {
    const postReactions = reactions.filter((reaction) => reaction.post_id === post.id);

    const viewerReaction = viewerActorId
      ? postReactions.find((reaction) => reaction.actor_id === viewerActorId)
      : null;

    return {
      ...post,
      likeCount: postReactions.filter((reaction) => reaction.reaction === "like").length,
      dislikeCount: postReactions.filter((reaction) => reaction.reaction === "dislike").length,
      roseCount: roseCounts[post.id] || 0,
      commentCount: commentCounts[post.id] || 0,
      userHasReacted: viewerReaction?.reaction ?? null,
    };
  });
}
