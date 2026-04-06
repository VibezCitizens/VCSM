// src/features/post/commentcard/components/CommentCard.container.jsx

import useCommentCard from "../hooks/useCommentCard";
import CommentCardView from "../ui/CommentCard.view";

export default function CommentCardContainer({
  rawComment,
  viewerActorId,
  onOpenMenu,

  editingCommentId,
  editingInitialText,
  onCancelInlineEdit,
  onEditedSaved,

  covered = false,
  cover = null,

  onReplyStart,
}) {
  const controller = useCommentCard(rawComment);
  const { comment } = controller;

  const commentActorId = comment.actorId ?? null;
  const isOwn = (commentActorId ?? null) === (viewerActorId ?? null);

  const canReport = !!viewerActorId && !isOwn && typeof onOpenMenu === "function";
  const canDelete = !!viewerActorId && isOwn && typeof onOpenMenu === "function";
  const showDots = canDelete || canReport;

  // ✅ ROOT ONLY: hide Reply on reply-cards
  const isRoot = !(comment.parent_id ?? rawComment?.parent_id ?? comment.parentId ?? rawComment?.parentId);

  return (
    <CommentCardView
      key={comment.id}
      comment={comment}
      actor={commentActorId}

      liked={comment.isLiked}
      likeCount={comment.likeCount}

      canLike={controller.canLike}

      // ✅ only top sparks can be replied to
      canReply={isRoot && controller.canReply}

      canDelete={canDelete}
      canReport={canReport}

      onLike={controller.toggleLike}

      // ✅ only attach handler when root
      onReply={isRoot ? () => onReplyStart?.(comment.id) : undefined}

      onToggleReplies={controller.toggleExpanded}

      onOpenMenu={showDots ? onOpenMenu : undefined}

      showReplies={controller.expanded}

      editingCommentId={editingCommentId}
      editingInitialText={editingInitialText}
      onCancelInlineEdit={onCancelInlineEdit}
      onEditedSaved={onEditedSaved}

      covered={covered}
      cover={cover}
    />
  );
}
