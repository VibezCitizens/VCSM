// src/features/post/commentcard/components/CommentReplyInput.jsx
// ============================================================
// CommentReplyInput
// - UI ONLY
// - Controlled textarea
// - Enter = submit, Shift+Enter = newline
// - No DAL, no identity, no Supabase
// ============================================================

import { useState, useCallback } from "react";

export default function CommentReplyInput({
  autoFocus = true,
  placeholder = "Write a reply…",
  submitting = false,

  onSubmit,
  onCancel,
}) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || submitting) return;

    onSubmit?.(trimmed);
    setValue("");
  }, [value, submitting, onSubmit]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="mt-3">
      <textarea
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        disabled={submitting}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        className="
          w-full resize-none rounded-lg
          bg-neutral-900 border border-neutral-800
          px-3 py-2 text-sm text-neutral-100
          placeholder:text-neutral-500
          focus:outline-none focus:ring-1 focus:ring-neutral-600
        "
      />

      <div className="flex items-center justify-end gap-3 mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="
              text-xs text-neutral-400
              hover:text-white transition
            "
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !value.trim()}
          className="
            text-xs font-medium
            px-3 py-1.5 rounded-md
            bg-white text-black
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-neutral-200 transition
          "
        >
          Reply
        </button>
      </div>
    </div>
  );
}
