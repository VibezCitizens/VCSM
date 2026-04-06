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
      <div className="relative w-[92%] max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold">{title}</div>
          <button
            type="button"
            className="text-neutral-400 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 text-sm text-neutral-300">
          Share this link
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="
              w-full rounded-lg bg-neutral-800
              border border-neutral-700
              px-3 py-2 text-sm text-neutral-100
            "
          />
          <button
            type="button"
            className="
              rounded-lg bg-neutral-200 text-neutral-900
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
              px-3 py-2 text-sm text-neutral-200
              hover:bg-neutral-800
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
