import useCommentCard from "../hooks/useCommentCard";
import CommentCardView from "../ui/CommentCard.view";

export default function CommentCardContainer({
  rawComment,
  viewerActorId,
  onOpenMenu,

  // ✅ inline edit control from PostDetail -> CommentList
  editingCommentId,
  editingInitialText,
  onCancelInlineEdit,
  onEditedSaved,
}) {
  const controller = useCommentCard(rawComment);
  const { comment } = controller;

  const commentActorId = comment.actorId ?? null;
  const isOwn = (commentActorId ?? null) === (viewerActorId ?? null);

  // ✅ permissions
  const canReport = !!viewerActorId && !isOwn && typeof onOpenMenu === "function";
  const canDelete = !!viewerActorId && isOwn && typeof onOpenMenu === "function";

  // show dots if either delete (own) OR report (not own)
  const showDots = canDelete || canReport;

  return (
    <CommentCardView
      key={comment.id}
      comment={comment}
      actor={commentActorId}

      liked={comment.isLiked}
      likeCount={comment.likeCount}

      canLike={controller.canLike}
      canReply={controller.canReply}

      // ✅ now these mean real permissions (not "show dots")
      canDelete={canDelete}
      canReport={canReport}

      onLike={controller.toggleLike}
      onReply={() => {}}
      onToggleReplies={controller.toggleExpanded}

      // ✅ centralized menu opener (PostDetail)
      onOpenMenu={showDots ? onOpenMenu : undefined}

      showReplies={controller.expanded}

      // ✅ inline edit props
      editingCommentId={editingCommentId}
      editingInitialText={editingInitialText}
      onCancelInlineEdit={onCancelInlineEdit}
      onEditedSaved={onEditedSaved}
    />
  );
}
