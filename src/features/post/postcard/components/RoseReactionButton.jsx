// src/features/post/postcard/components/RoseReactionButton.jsx

import React from "react";

export default function RoseReactionButton({
  count,
  onSend,
  disabled,
}) {
  return (
    <button
      onClick={() => onSend?.(1)}
      disabled={disabled}
      className="
        flex items-center gap-2 text-2xl transition-all duration-150
        opacity-70 hover:opacity-100
      "
    >
      <span>🌹</span>

      <span className="text-sm text-neutral-300 font-medium">
        {count}
      </span>
    </button>
  );
}
