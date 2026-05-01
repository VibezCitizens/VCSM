import React from "react";

export function VportReviewDeleteModal({ open, onClose, isDeleting, onDelete }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/12 bg-white/4 p-6">
        <div className="text-base font-semibold text-white">Delete your review?</div>
        <p className="mt-2 text-sm text-white/50">This will permanently remove your review. This can't be undone.</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onDelete}
            className="rounded-full border border-red-400/35 bg-red-400/12 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/22 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete review"}
          </button>
        </div>
      </div>
    </div>
  );
}
