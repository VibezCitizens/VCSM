import {
  listActorCommentLikeRows,
  listCommentLikeRowsByCommentIds,
} from "@/features/post/commentcard/dal/commentLikes.dal";

export async function hydrateCommentReactions({
  comments,
  actorId,
}) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return comments;
  }

  const commentIds = comments.map((comment) => comment.id).filter(Boolean);
  if (!commentIds.length) return comments;

  const [countRows, likedRows] = await Promise.all([
    listCommentLikeRowsByCommentIds(commentIds),
    listActorCommentLikeRows({ actorId, commentIds }),
  ]);

  const countMap = {};
  for (const row of countRows ?? []) {
    countMap[row.comment_id] = (countMap[row.comment_id] ?? 0) + 1;
  }

  const likedSet = new Set((likedRows ?? []).map((row) => row.comment_id));

  return comments.map((comment) => ({
    ...comment,
    is_liked: likedSet.has(comment.id),
    like_count: countMap[comment.id] ?? 0,
  }));
}
