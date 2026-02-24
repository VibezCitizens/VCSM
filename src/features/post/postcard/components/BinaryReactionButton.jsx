// src/features/post/postcard/components/BinaryReactionButton.jsx

import React from "react";

export default function BinaryReactionButton({
  emoji,
  active,
  count,
  onClick,
  disabled,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 text-xl px-1.5 py-1 rounded-lg transition-all duration-150
        ${
          active
            ? "scale-110 opacity-100 drop-shadow-[0_0_10px_rgba(196,124,255,0.65)]"
            : "opacity-80 hover:opacity-100"
        }
      `}
    >
      <span
        className={
          active
            ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
            : ""
        }
      >
        {emoji}
      </span>

      <span className={`text-sm font-medium ${active ? "text-slate-100" : "text-slate-300"}`}>
        {count}
      </span>
    </button>
  );
}
