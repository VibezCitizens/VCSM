// src/features/posts/ui/CommentList.jsx
/**
 * Renders a list of comments using CommentCard. Pure UI.
 */
import { memo } from 'react';
import CommentCard from '@/features/posts/components/CommentCard';

function CommentList({
  comments = [],
  expanded = false,
  onToggle = () => {},
  postAuthorType = 'user',  // 'user' | 'vport'
  postVportId = null,
  onDeleteComment = () => {},
}) {
  return (
    <div className="mt-2">
      {comments.length > 0 ? (
        expanded ? (
          <button onClick={() => onToggle(false)} className="text-xs text-purple-400">
            Hide comments ({comments.length})
          </button>
        ) : (
          <button onClick={() => onToggle(true)} className="text-xs text-purple-400">
            View comments ({comments.length})
          </button>
        )
      ) : (
        !expanded && (
          <button onClick={() => onToggle(true)} className="text-xs text-purple-400">
            Be the first to comment!
          </button>
        )
      )}

      {expanded && (
        <div className="space-y-2 mt-2">
          {comments.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-2">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                postAuthorType={postAuthorType}
                postVportId={postVportId}
                onDelete={(id) => onDeleteComment(id)} // parent handles optimistic removal
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default memo(CommentList);
