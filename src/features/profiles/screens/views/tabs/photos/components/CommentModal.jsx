import { useEffect, useState } from "react";
import CommentCard from "@/features/post/commentcard/components/CommentCard.container";

/**
 * CommentModal
 * ------------------------------------------------------------
 * UI-only modal for viewing & creating comments.
 *
 * RULES:
 * - Receives all domain behavior via hook
 * - Never touches Supabase, DAL, or controllers
 * - Actor identity is resolved outside and injected
 */
export default function CommentModal({
  postId,
  onClose,

  // injected hook (domain-owned)
  useCommentsHook,
}) {
  const {
    actorId,
    comments,
    loading,
    error,
    refresh,
    createComment,
    removeLocal,
  } = useCommentsHook(postId);

  const [draft, setDraft] = useState("");

  // ----------------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------------
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ----------------------------------------------------------
  // CREATE COMMENT (UI intent)
  // ----------------------------------------------------------
  async function handleSubmit() {
    const content = draft.trim();
    if (!content) return;

    await createComment(content);
    setDraft("");
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">
          Comments
        </h2>

        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-xl"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading && (
          <div className="text-center text-neutral-400 py-6">
            Loading comments…
          </div>
        )}

        {!loading && !comments.length && (
          <div className="text-center text-neutral-500 py-6">
            No comments yet.
          </div>
        )}

        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            rawComment={comment}
            onDelete={() => removeLocal(comment.id)}
          />
        ))}

        {error && (
          <div className="text-center text-red-400 text-sm">
            Failed to load comments.
          </div>
        )}
      </div>

      {/* INPUT */}
      {actorId && (
        <div className="border-t border-white/10 px-4 py-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 rounded-md bg-neutral-800 text-white px-3 py-2 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />

          <button
            onClick={handleSubmit}
            disabled={!draft.trim()}
            className="px-4 py-2 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}
