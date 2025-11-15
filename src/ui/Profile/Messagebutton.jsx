import React, { lazy, Suspense } from "react";

const ChatCenteredDots = lazy(() =>
  import("phosphor-react").then((m) => ({ default: m.ChatCenteredDots }))
);

export default function MessageButton({ label = "Message", onClick, disabled = false }) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-5 py-2 rounded-md 
        w-[140px]
        border border-black text-black font-medium bg-white 
        hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Suspense fallback={<div className="w-4 h-4" />}>
        {/* fixed-width icon box */}
        <span className="inline-flex w-4 justify-center">
          <ChatCenteredDots size={18} weight="regular" />
        </span>
      </Suspense>
      <span>{label}</span>
    </button>
  );
}
