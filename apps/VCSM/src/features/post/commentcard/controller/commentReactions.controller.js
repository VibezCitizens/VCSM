import {
  likeComment,
  unlikeComment,
  isCommentLiked,
  getCommentLikeCount,
} from "../dal/commentLikes.dal";
import { readCommentActorAndPostIdDAL } from "../dal/comments.dal";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";

export async function toggleCommentLike({
  commentId,
  actorId,
}) {
  if (!actorId || !commentId) return null;

  const alreadyLiked = await isCommentLiked({ commentId, actorId });

  if (alreadyLiked) {
    // Toggle OFF — removed, no notification
    await unlikeComment({ commentId, actorId });
  } else {
    // New like — created
    await likeComment({ commentId, actorId });

    const comment = await readCommentActorAndPostIdDAL(commentId);

    if (comment?.actor_id) {
      publishVcsmNotification({
        recipientActorId: comment.actor_id,
        actorId,
        kind: 'social.post.comment_like',
        objectType: 'comment',
        objectId: commentId,
        linkPath: comment.post_id ? `/post/${comment.post_id}` : null,
        context: {},
      });
    }
  }

  const likeCount = await getCommentLikeCount(commentId);

  return {
    isLiked: !alreadyLiked,
    likeCount,
  };
}

