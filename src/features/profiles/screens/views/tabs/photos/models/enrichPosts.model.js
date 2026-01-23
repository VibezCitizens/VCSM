/**
 * ============================================================
 * Model: enrichPosts
 * ------------------------------------------------------------
 * Translates raw database state into domain-safe post objects
 * ============================================================
 */

/**
 * @param {Object} params
 * @param {Array}  params.posts
 * @param {Array}  params.reactions
 * @param {Object} params.commentCounts
 * @param {Object} params.roseCounts
 * @param {string} params.viewerActorId
 */
export function enrichPostsModel({
  posts = [],
  reactions = [],
  commentCounts = {},
  roseCounts = {},
  viewerActorId,
}) {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  return posts.map((post) => {
    const postReactions = reactions.filter(
      (r) => r.post_id === post.id
    );

    const viewerReaction = viewerActorId
      ? postReactions.find(
          (r) => r.actor_id === viewerActorId
        )
      : null;

    return {
      // ---------------- RAW POST ----------------
      ...post,

      // ---------------- DERIVED COUNTS ----------------
      likeCount: postReactions.filter(
        (r) => r.reaction === "like"
      ).length,

      dislikeCount: postReactions.filter(
        (r) => r.reaction === "dislike"
      ).length,

      // ✅ FIX: roses come from post_rose_gifts
      roseCount: roseCounts[post.id] || 0,

      commentCount: commentCounts[post.id] || 0,

      // ---------------- VIEWER STATE ----------------
      userHasReacted: viewerReaction?.reaction ?? null,
    };
  });
}
