// src/features/post/postcard/components/BinaryReactionButton.jsx

import React from "react";

export default function BinaryReactionButton({
  type,
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
        flex items-center gap-2 text-2xl transition-all duration-150
        ${active ? "scale-125 opacity-100" : "opacity-70 hover:opacity-100"}
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

      <span className="text-sm text-neutral-300 font-medium">
        {count}
      </span>
    </button>
  );
}
