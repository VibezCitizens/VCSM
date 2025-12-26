// ============================================================
// CommentInput View
// ------------------------------------------------------------
// - Pure UI
// - Fully actor-based
// - 🔒 actorId only
// - Presentation resolved via actor store
// ============================================================

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useActorPresentation } from "@/state/actors/useActorPresentation";

export default function CommentInputView({
  actorId,
  onSubmit,
  placeholder = "Write a comment...",
  autoFocus = false,
  disabled = false,
}) {
  const actorUI = useActorPresentation(actorId);

  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      textareaRef.current.scrollHeight + "px";
  }, [text]);

  function handleSubmit() {
    if (disabled) return;
    const value = text.trim();
    if (!value) return;
    onSubmit?.(value);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex gap-3 px-3 py-3 border-t border-neutral-900 bg-black/40"
    >
      {/* AVATAR */}
      <div className="w-10 h-10 rounded-md overflow-hidden bg-neutral-800 flex-shrink-0">
        <img
          src={actorUI?.avatar || "/avatar.jpg"}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* INPUT */}
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={text}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Sign in to comment" : placeholder}
          rows={1}
          className="
            w-full resize-none overflow-hidden
            rounded-xl bg-neutral-900/60
            px-3 py-2 text-sm text-neutral-100
            placeholder-neutral-500
            border border-neutral-700
            focus:outline-none
            focus:ring-2 focus:ring-purple-500
            focus:border-purple-500
          "
        />

        <div className="flex justify-end mt-2">
          <button
            onClick={handleSubmit}
            disabled={disabled || !text.trim()}
            className={
              !text.trim() || disabled
                ? "bg-neutral-800 text-neutral-500 px-4 py-1.5 rounded-full text-sm cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-full text-sm"
            }
          >
            Post
          </button>
        </div>
      </div>
    </motion.div>
  );
}
