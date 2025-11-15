// src/features/chat/components/TypingIndicator.jsx
import React from 'react';

export default function TypingIndicator({ isTyping, offsetPx = 84 }) {
  if (!isTyping) return null;

  return (
    <div
      className="absolute left-0 right-0 z-10 px-3 pointer-events-none"
      style={{ bottom: `calc(${offsetPx}px + env(safe-area-inset-bottom) + 6px)` }}
      aria-live="polite"
      role="status"
    >
      <div className="inline-flex items-center gap-2 rounded-xl bg-black/70 backdrop-blur px-3 py-2">
        <span className="sr-only">User is typing</span>
        <span className="text-sm text-white/60">Typing</span>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-white/60 motion-safe:animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-white/60 motion-safe:animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-white/60 motion-safe:animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
