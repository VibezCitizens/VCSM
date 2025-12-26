// src/features/post/commentcard/components/CommentReplies.jsx

import CommentCardContainer from "./CommentCard.container";

export default function CommentReplies({
  replies = [],
  isVisible = false,
}) {
  if (!isVisible || !replies.length) return null;

  return (
    <div className="mt-3 ml-6 pl-4 border-l border-neutral-700/40 space-y-3">
      {replies.map((reply) => (
        <CommentCardContainer
          key={reply.id}
          rawComment={reply}
        />
      ))}
    </div>
  );
}
