// src/features/post/postcard/components/ShareReactionButton.jsx

import React from "react";

export default function ShareReactionButton({
  count = null,
  onClick,
  disabled,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center gap-2 text-2xl transition-all duration-150
        opacity-70 hover:opacity-100
      "
      aria-label="Spread"
      title="Spread"
      type="button"
    >
      {/* uniform icon box so it matches other buttons */}
      <span className="relative inline-flex items-center justify-center w-7 h-7 leading-none">
        {/* globe */}
        <span className="text-[22px]">🌍</span>

        {/* N / S / E / W arrows (WHITE) */}
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] text-white">
          ↑
        </span>

        <span className="absolute top-1/2 -right-3 -translate-y-1/2 text-[10px] text-white">
          →
        </span>

        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white">
          ↓
        </span>

        <span className="absolute top-1/2 -left-3 -translate-y-1/2 text-[10px] text-white">
          ←
        </span>
      </span>

      {count !== null && (
        <span className="text-sm text-white font-medium">
          {count}
        </span>
      )}
    </button>
  );
}
