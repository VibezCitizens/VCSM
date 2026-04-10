// BlockConfirmModal.jsx

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useActorSummary } from "@/state/actors/useActorSummary";

export default function BlockConfirmModal({
  open,
  mode = "block",
  targetActorId,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const actor = useActorSummary(targetActorId);

  useEffect(() => {
    if (!open) return;

    // optional: lock background scroll while modal is open
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  const isBlock = mode === "block";

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black"
      onClick={onCancel}
    >
      <div
        className="
          w-full max-w-sm
          rounded-xl
          bg-black
          border border-white/10
          p-5
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <header className="space-y-1">
          <h3 className="text-lg font-semibold text-white">
            {isBlock ? "Block Citizen" : "Unblock Citizen"}
          </h3>

          {actor && (
            <p className="text-sm text-white/50">
              {isBlock
                ? `You are about to block ${actor.displayName}.`
                : `You are about to unblock ${actor.displayName}.`}
            </p>
          )}
        </header>

        {/* ================= BODY ================= */}
        {isBlock && (
          <div className="mt-4 text-sm text-white/50 space-y-2">
            <p>Blocking will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Remove them from your followers and friends</li>
              <li>Prevent Vox and interactions</li>
              <li>Hide their content from you</li>
            </ul>
          </div>
        )}

        {/* ================= ACTIONS ================= */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="
              px-4 py-2 text-sm rounded-lg
              border border-neutral-700
              text-white/70
              hover:bg-white/6
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={
              isBlock
                ? `
                  px-4 py-2 text-sm rounded-lg
                  bg-red-600 text-white
                  hover:bg-red-500
                  disabled:opacity-50
                `
                : `
                  px-4 py-2 text-sm rounded-lg
                  bg-white/6 text-white
                  hover:bg-white/8
                  disabled:opacity-50
                `
            }
          >
            {loading ? "Working…" : isBlock ? "Block" : "Unblock"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
