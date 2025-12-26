// src/features/post/commentcard/components/CommentList.jsx
// ============================================================
// CommentList
// - Pure list renderer
// - No hooks per item
// - Safe hook order
// ============================================================

import CommentCardContainer from "./CommentCard.container";

export default function CommentList({ comments }) {
  if (!Array.isArray(comments) || comments.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {comments.map((rawComment) => (
        <CommentCardContainer
          key={rawComment.id}
          rawComment={rawComment}
        />
      ))}
    </div>
  );
}
