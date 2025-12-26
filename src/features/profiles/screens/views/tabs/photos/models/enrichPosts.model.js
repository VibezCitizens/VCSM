/**
 * ============================================================
 * Model: enrichPosts
 * ------------------------------------------------------------
 * Translates raw database state into domain-safe post objects
 *
 * Answers ONE question:
 *   "What does this post data mean to the application?"
 *
 * 🚫 No I/O
 * 🚫 No Supabase
 * 🚫 No controllers
 * 🚫 No hooks
 * ============================================================
 */

/**
 * @param {Object} params
 * @param {Array}  params.posts        Raw post rows
 * @param {Array}  params.reactions    Raw reaction rows
 * @param {Object} params.commentCounts Map of post_id → count
 * @param {string} params.viewerActorId
 *
 * @returns {Array}
 */
export function enrichPostsModel({
  posts = [],
  reactions = [],
  commentCounts = {},
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

      roseCount: postReactions.filter(
        (r) => r.reaction === "rose"
      ).length,

      commentCount: commentCounts[post.id] || 0,

      // ---------------- VIEWER STATE ----------------
      userHasReacted: viewerReaction?.reaction ?? null,
    };
  });
}
