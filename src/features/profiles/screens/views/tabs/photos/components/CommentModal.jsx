// src/features/profiles/screens/views/tabs/photos/components/CommentModal.jsx

import { useEffect, useState } from "react";
import useCommentThread from "@/features/post/commentcard/hooks/useCommentThread";
import CommentCard from "@/features/post/commentcard/components/CommentCard.container";

/**
 * CommentModal
 * ------------------------------------------------------------
 * UI-only modal for viewing & creating comments.
 *
 * Fixes:
 * - Input bar is sticky and padded to avoid bottom nav overlap
 * - Adds safe-area inset padding (iOS)
 */
export default function CommentModal({ postId, onClose }) {
  const thread = useCommentThread(postId);

  const { actorId, comments, loading, posting, reload, addComment } = thread;

  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!postId) return;
    reload?.();
  }, [postId, reload]);

  async function handleSubmit() {
    const content = draft.trim();
    if (!content || posting) return;

    await addComment(content);
    setDraft("");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Comments</h2>

        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-xl"
          aria-label="Close"
          type="button"
        >
          ×
        </button>
      </div>

      {/* BODY (list + input) */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* LIST */}
        <div
          className="
            flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4
            pb-[calc(env(safe-area-inset-bottom)+96px)]
          "
        >
          {loading && (
            <div className="text-center text-neutral-400 py-6">
              Loading comments…
            </div>
          )}

          {!loading && (!comments || comments.length === 0) && (
            <div className="text-center text-neutral-500 py-6">
              No comments yet.
            </div>
          )}

          {(comments || []).map((comment) => (
            <CommentCard key={comment.id} rawComment={comment} />
          ))}
        </div>

        {/* INPUT (sticky above bottom nav + safe area) */}
        {actorId && (
          <div
            className="
              sticky bottom-0 z-50
              border-t border-white/10
              bg-black/95 backdrop-blur
              px-4 py-3 flex gap-2
              pb-[calc(env(safe-area-inset-bottom)+16px)]
            "
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 rounded-md bg-neutral-800 text-white px-3 py-2 text-sm border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />

            <button
              onClick={handleSubmit}
              disabled={!draft.trim() || posting}
              className="px-4 py-2 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
