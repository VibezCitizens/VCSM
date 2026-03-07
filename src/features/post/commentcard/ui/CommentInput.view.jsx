// ============================================================
// CommentInput View
// ------------------------------------------------------------
// - Pure UI
// - Fully actor-based
// - 🔒 actorId only
// - Presentation resolved via actor store
// ============================================================

import React, { useState, useRef, useEffect } from "react";
import { useActorSummary } from "@/state/actors/useActorSummary";

export default function CommentInputView({
  actorId,
  onSubmit,
  placeholder = "Write a Spark...",
  autoFocus = false,
  disabled = false,
}) {
  const actorSummary = useActorSummary(actorId);

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
    <div className="spark-composer flex gap-3 px-3 py-3 border-t border-violet-300/10 bg-[#0f0c1a]/70">
      {/* AVATAR */}
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#151125] border border-indigo-300/25 shadow-[0_0_14px_rgba(88,132,255,0.22)] flex-shrink-0">
        <img
          src={actorSummary?.avatar || "/avatar.jpg"}
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
          placeholder={disabled ? "Sign in to Spark" : placeholder}
          rows={1}
          className="
            w-full resize-none overflow-hidden
            rounded-xl bg-[#130f20]/92
            px-3 py-2 text-sm text-slate-100
            placeholder:text-slate-500
            border border-indigo-300/28
            shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(8,16,40,0.4)]
            focus:outline-none
            focus:ring-2 focus:ring-indigo-400/45
            focus:border-indigo-300/55
          "
        />

        <div className="flex justify-end mt-2">
          <button
            onClick={handleSubmit}
            disabled={disabled || !text.trim()}
            className={
              !text.trim() || disabled
                ? "bg-slate-800/80 text-slate-500 px-4 py-1.5 rounded-full text-sm cursor-not-allowed"
                : "bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400 hover:from-violet-400 hover:via-indigo-400 hover:to-sky-300 text-white px-4 py-1.5 rounded-full text-sm shadow-[0_0_14px_rgba(96,138,255,0.42)]"
            }
          >
            Vibe
          </button>
        </div>
      </div>
    </div>
  );
}
