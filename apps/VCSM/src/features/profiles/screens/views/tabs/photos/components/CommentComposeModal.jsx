// src/features/profiles/screens/views/tabs/photos/components/CommentComposeModal.jsx
// ============================================================
// CommentComposeModal (UI ONLY) — MATCH PostDetail behavior
// - Fullscreen overlay
// - Freezes background scroll (iOS-safe)
// - Bottom composer for NEW top-level Spark
// - ✅ forwardRef() so parent can focus during tap gesture
// - ❌ NO visualViewport keyboard offset (prevents bottom-nav “push” gap)
// ============================================================

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";

const CommentComposeModal = forwardRef(function CommentComposeModal(
  {
    open = false,
    submitting = false,
    placeholder = "Write a Spark…",
    onSubmit,
    onClose,
  },
  ref
) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  // ✅ expose focus() to parent
  useImperativeHandle(
    ref,
    () => ({
      focus: () => textareaRef.current?.focus?.(),
      blur: () => textareaRef.current?.blur?.(),
    }),
    []
  );

  // ✅ HIDE BottomNavBar while compose modal is open (prevents iOS keyboard lifting it)
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("vcsm-modal-open");
    return () => {
      document.documentElement.classList.remove("vcsm-modal-open");
    };
  }, [open]);

  // ✅ Freeze background scroll (iOS Safari safe) — same as PostDetail
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY || 0;
    const body = document.body;

    const prevOverflow = body.style.overflow;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = prevOverflow;
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Reset when closing
  useEffect(() => {
    if (!open) setValue("");
  }, [open]);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
      />

      {/* Bottom sheet — SAME as PostDetail (no keyboard offset math) */}
      <div
        className="
          absolute inset-x-0 bottom-0
          bg-neutral-950
          border-t border-neutral-800
          rounded-t-2xl
          px-4 pt-4
          pb-[calc(env(safe-area-inset-bottom)+14px)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-neutral-200 font-medium">New Spark</div>

          <button
            type="button"
            onClick={onClose}
            className="text-sm text-neutral-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          placeholder={placeholder}
          disabled={submitting}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="
            w-full resize-none rounded-xl
            bg-neutral-900 border border-neutral-800
            px-3 py-2 text-sm text-neutral-100
            placeholder:text-neutral-500
            focus:outline-none focus:ring-2 focus:ring-purple-500
            focus:border-purple-500
          "
        />

        <div className="flex items-center justify-end gap-3 mt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="
              text-xs text-neutral-300
              px-3 py-2 rounded-lg
              bg-neutral-800 hover:bg-neutral-700
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !value.trim()}
            className="
              text-xs font-medium
              px-4 py-2 rounded-lg
              bg-purple-600 hover:bg-purple-700
              text-white
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Spark
          </button>
        </div>
      </div>
    </div>
  );
});

export default CommentComposeModal;
