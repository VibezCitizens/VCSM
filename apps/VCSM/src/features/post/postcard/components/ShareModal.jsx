// src/features/post/postcard/components/ShareModal.jsx

import React from "react";

export default function ShareModal({
  open,
  title = "Spread",
  url = "",
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // close when clicking backdrop
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* modal */}
      <div className="relative w-[92%] max-w-md rounded-2xl border border-white/10 bg-white/4 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold">{title}</div>
          <button
            type="button"
            className="text-white/50 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 text-sm text-white/70">
          Share this link
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="
              w-full rounded-lg bg-white/6
              border border-neutral-700
              px-3 py-2 text-sm text-white/95
            "
          />
          <button
            type="button"
            className="
              rounded-lg bg-white/20 text-black
              px-3 py-2 text-sm font-medium
              hover:bg-white
            "
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
              } catch {
                window.prompt("Copy this link:", url);
              }
            }}
          >
            Copy
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="
              rounded-lg border border-neutral-700
              px-3 py-2 text-sm text-white/85
              hover:bg-white/6
            "
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
