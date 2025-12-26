// src/features/post/commentcard/components/cc/CommentActions.jsx

export default function CommentActions({
  liked,
  likeCount,
  canLike,
  canReply,
  onLike,
  onReply,
}) {
  return (
    <div className="mt-2 flex items-center gap-6 text-xs text-neutral-300">
      {canLike && (
        <button
          onClick={onLike}
          className={`
            flex items-center gap-1.5
            transition
            ${liked
              ? "text-red-500"
              : "text-neutral-300 hover:text-red-400"}
          `}
        >
          {/* Use emoji heart for visibility */}
          <span className="text-base leading-none">
            {liked ? "❤️" : "🤍"}
          </span>

          {likeCount > 0 && (
            <span className="text-xs font-medium">
              {likeCount}
            </span>
          )}
        </button>
      )}

      {canReply && (
        <button
          onClick={onReply}
          className="
            text-neutral-300
            hover:text-white
            transition
          "
        >
          Reply
        </button>
      )}
    </div>
  );
}
