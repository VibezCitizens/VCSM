import {
  likeComment,
  unlikeComment,
  isCommentLiked,
  getCommentLikeCount,
} from "../dal/commentLikes.dal";

export async function toggleCommentLike({
  commentId,
  actorId,
}) {
  if (!actorId || !commentId) return null;

  const alreadyLiked = await isCommentLiked({ commentId, actorId });

  if (alreadyLiked) {
    await unlikeComment({ commentId, actorId });
  } else {
    await likeComment({ commentId, actorId });
  }

  const likeCount = await getCommentLikeCount(commentId);

  return {
    isLiked: !alreadyLiked,
    likeCount,
  };
}

