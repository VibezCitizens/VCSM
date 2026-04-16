import {
  likeComment,
  unlikeComment,
  isCommentLiked,
  getCommentLikeCount,
} from "../dal/commentLikes.dal";

import { publishVcsmNotification } from "@/features/notifications/publish";

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

    // Resolve comment author for notification
    const { supabase } = await import('@/services/supabase/supabaseClient');
    const { data: comment } = await supabase
      .schema('vc')
      .from('post_comments')
      .select('actor_id, post_id')
      .eq('id', commentId)
      .maybeSingle();

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

