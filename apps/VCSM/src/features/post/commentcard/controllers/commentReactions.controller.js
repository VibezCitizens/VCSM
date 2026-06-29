import {
  likeComment,
  unlikeComment,
  isCommentLiked,
  getCommentLikeCount,
} from "../dal/commentLikes.dal";
import { readCommentActorAndPostIdDAL } from "../dal/comments.dal";
import { readPostActorOwnerLinkDAL } from "@/features/post/postcard/dal/postActorOwnership.read.dal";
import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";
import { publishVcsmNotification } from "@/features/notifications/adapters/notifications.adapter";

export async function toggleCommentLike({
  commentId,
  actorId,
}) {
  if (!actorId || !commentId) return null;

  // V06A-M1: session-derived, kind-agnostic authorship bind before the like write
  // (mirrors createPostController). DiD only; durable boundary = RLS (06A-DB-1, Phase 15).
  const user = await readCurrentAuthUser();
  if (!user) throw new Error("toggleCommentLike: not authenticated");
  const ownerLink = await readPostActorOwnerLinkDAL({ actorId, userId: user.id });
  if (!ownerLink) throw new Error("toggleCommentLike: actor not owned by session user");

  const alreadyLiked = await isCommentLiked({ commentId, actorId });

  if (alreadyLiked) {
    // Toggle OFF — removed, no notification
    await unlikeComment({ commentId, actorId });
    const likeCount = await getCommentLikeCount(commentId);
    return { isLiked: false, likeCount };
  }

  // New like — notification routing and count read are independent, run in parallel
  await likeComment({ commentId, actorId });

  const [comment, likeCount] = await Promise.all([
    readCommentActorAndPostIdDAL(commentId),
    getCommentLikeCount(commentId),
  ]);

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

  return { isLiked: true, likeCount };
}

