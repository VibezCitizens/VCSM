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
  postAuthorType = 'user', // 'user' | 'vport'
  postVportId = null,
  onDeleteComment = () => {},
}) {
  const count = comments.length;
  const hasComments = count > 0;

  return (
    <div className="mt-2">
      {/* Toggle / Empty-CTA */}
      {hasComments ? (
        <button
          type="button"
          onClick={() => onToggle(!expanded)}
          className="text-xs text-purple-400"
          aria-expanded={expanded}
        >
          {expanded ? `Hide comments (${count})` : `View comments (${count})`}
        </button>
      ) : (
        !expanded && (
          <button
            type="button"
            onClick={() => onToggle(true)}
            className="text-xs text-purple-400"
            aria-expanded={false}
          >
            Be the first to comment!
          </button>
        )
      )}

      {/* Comments list */}
      {expanded && (
        <div className="space-y-2 mt-2">
          {hasComments ? (
            comments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                postAuthorType={postAuthorType}
                postVportId={postVportId}
                onDelete={(id) => onDeleteComment(id)}
              />
            ))
          ) : (
            <p className="text-neutral-400 text-sm text-center py-2">No comments yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(CommentList);
