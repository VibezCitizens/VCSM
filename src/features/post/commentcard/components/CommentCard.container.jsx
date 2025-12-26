// src/features/post/commentcard/components/CommentCard.container.jsx

import useCommentCard from "../hooks/useCommentCard";
import CommentCardView from "../ui/CommentCard.view";

export default function CommentCardContainer({ rawComment }) {
  const controller = useCommentCard(rawComment);
  const { comment } = controller;

  // 🔒 ACTOR ID ONLY (resolved via actorStore in UI)
  const actorId = comment.actorId ?? null;

  return (
    <CommentCardView
      key={comment.id}
      comment={comment}
      actor={actorId}

      // state
      liked={comment.isLiked}
      likeCount={comment.likeCount}

      // permissions
      canLike={controller.canLike}
      canReply={controller.canReply}
      canDelete={controller.canDelete}

      // actions
      onLike={controller.toggleLike}
      onReply={() => {}}
      onDelete={controller.deleteComment}
      onToggleReplies={controller.toggleExpanded}

      showReplies={controller.expanded}
    />
  );
}
