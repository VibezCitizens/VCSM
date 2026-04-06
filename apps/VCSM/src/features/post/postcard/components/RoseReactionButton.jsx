import React from "react";

export default function RoseReactionButton({ count, onSend, disabled }) {
  return (
    <button
      onClick={() => onSend?.(1)}
      disabled={disabled}
      className="
        flex items-center gap-2 text-xl px-1.5 py-1 rounded-lg transition-all duration-150
        opacity-80 hover:opacity-100
      "
      type="button"
      aria-label="Rose"
    >
      <span>{`\uD83C\uDF39`}</span>
      <span className="text-sm text-slate-300 font-medium">{count}</span>
    </button>
  );
}
