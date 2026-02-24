import React from "react";

export default function CommentButton({ count = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-2 text-xl px-1.5 py-1 rounded-lg transition-all duration-150
        opacity-80 hover:opacity-100
      "
      type="button"
      aria-label="Comments"
    >
      <span>{`\uD83D\uDCAC`}</span>
      <span className="text-sm text-slate-300 font-medium">{count}</span>
    </button>
  );
}
