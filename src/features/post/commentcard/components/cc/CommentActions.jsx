export default function CommentActions({
  liked,
  likeCount,
  canLike,
  canReply,
  onLike,
  onReply,
}) {
  return (
    <div className="mt-2 flex items-center gap-6 text-xs text-slate-300">
      {canLike && (
        <button
          onClick={onLike}
          className={`
            flex items-center gap-1.5 transition
            ${liked
              ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.45)]"
              : "text-slate-300 hover:text-rose-300"}
          `}
          type="button"
        >
          <span className="text-base leading-none">
            {liked ? "\u2764\uFE0F" : "\uD83E\uDD0D"}
          </span>
          {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
        </button>
      )}

      {canReply && (
        <button
          onClick={onReply}
          className="text-slate-300 hover:text-slate-100 transition"
          type="button"
        >
          Reply
        </button>
      )}
    </div>
  );
}
