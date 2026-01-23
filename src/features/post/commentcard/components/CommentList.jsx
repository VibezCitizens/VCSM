import CommentCardContainer from "./CommentCard.container";

export default function CommentList({
  comments,
  viewerActorId,
  onOpenMenu,

  editingCommentId,
  editingInitialText,
  onCancelInlineEdit,
  onEditedSaved,
}) {
  if (!Array.isArray(comments) || comments.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {comments.map((rawComment) => (
        <CommentCardContainer
          key={rawComment.id}
          rawComment={rawComment}
          viewerActorId={viewerActorId}
          onOpenMenu={onOpenMenu}

          editingCommentId={editingCommentId}
          editingInitialText={editingInitialText}
          onCancelInlineEdit={onCancelInlineEdit}
          onEditedSaved={onEditedSaved}
        />
      ))}
    </div>
  );
}
