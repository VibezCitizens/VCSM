import React from "react";

export default function ShareReactionButton({ count = null, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center gap-2 text-xl px-1.5 py-1 rounded-lg transition-all duration-150
        opacity-80 hover:opacity-100
      "
      aria-label="Spread"
      title="Spread"
      type="button"
    >
      <span className="relative inline-flex items-center justify-center w-7 h-7 leading-none">
        <span className="text-[22px]">{`\uD83C\uDF0D`}</span>
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] text-white">
          {`\u2191`}
        </span>
        <span className="absolute top-1/2 -right-3 -translate-y-1/2 text-[10px] text-white">
          {`\u2192`}
        </span>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white">
          {`\u2193`}
        </span>
        <span className="absolute top-1/2 -left-3 -translate-y-1/2 text-[10px] text-white">
          {`\u2190`}
        </span>
      </span>
      {count !== null && <span className="text-sm text-slate-300 font-medium">{count}</span>}
    </button>
  );
}
