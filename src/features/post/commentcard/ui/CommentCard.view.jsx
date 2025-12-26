// src/features/post/commentcard/ui/CommentCard.view.jsx

import { motion } from "framer-motion";
import CommentHeader from "../components/cc/CommentHeader";
import CommentBody from "../components/cc/CommentBody";
import CommentActions from "../components/cc/CommentActions";

export default function CommentCardView({
  comment,
  actor,

  liked = false,
  likeCount = 0,
  showReplies = false,

  canLike = false,
  canReply = false,
  canDelete = false,

  hasReplies = false,

  onLike,
  onReply,
  onDelete,
  onToggleReplies,
}) {
  if (!comment) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="
        w-full px-4 py-3
        rounded-xl
        bg-neutral-900/35
        hover:bg-neutral-900/50
        transition
      "
    >
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <CommentHeader
            actor={actor}
            createdAt={comment.createdAt}
            canDelete={canDelete}
            onDelete={onDelete}
          />

          {/* Body */}
          <div className="mt-1">
            <CommentBody content={comment.content} />
          </div>

          {/* Divider + Actions */}
          <div className="mt-2 pt-1 border-t border-neutral-800/60">
            <CommentActions
              liked={liked}
              likeCount={likeCount}
              canLike={canLike}
              canReply={canReply}
              onLike={onLike}
              onReply={onReply}
            />
          </div>

          {/* Replies toggle */}
          {hasReplies && (
            <button
              onClick={onToggleReplies}
              className="
                mt-2 text-xs
                text-neutral-300
                hover:text-white
                transition
              "
            >
              {showReplies ? "Hide replies" : "View replies"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
