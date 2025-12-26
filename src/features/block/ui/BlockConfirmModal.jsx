// ============================================================
//  BLOCK SYSTEM — CONFIRM MODAL (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: BlockConfirmModal.jsx
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Confirm block / unblock intent
//    • Actor-based only
//    • UI-only (no DB calls)
// ------------------------------------------------------------
//  RULES:
//   • actorId is the ONLY identity
//   • No DAL usage
//   • No side effects here
// ============================================================

import { useActorPresentation } from "@/state/actors/useActorPresentation";

/**
 * PROPS
 * ------------------------------------------------------------
 * open            boolean
 * mode            "block" | "unblock"
 * targetActorId   uuid
 * loading         boolean
 * onConfirm       fn()
 * onCancel        fn()
 */
export default function BlockConfirmModal({
  open,
  mode = "block",
  targetActorId,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const actor = useActorPresentation(targetActorId);

  if (!open) return null;

  const isBlock = mode === "block";

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/60 backdrop-blur-sm
      "
      onClick={onCancel}
    >
      <div
        className="
          w-full max-w-sm
          rounded-xl
          bg-neutral-950
          border border-neutral-800
          p-5
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <header className="space-y-1">
          <h3 className="text-lg font-semibold text-white">
            {isBlock ? "Block user" : "Unblock user"}
          </h3>

          {actor && (
            <p className="text-sm text-neutral-400">
              {isBlock
                ? `You are about to block ${actor.displayName}.`
                : `You are about to unblock ${actor.displayName}.`}
            </p>
          )}
        </header>

        {/* ================= BODY ================= */}
        {isBlock && (
          <div className="mt-4 text-sm text-neutral-400 space-y-2">
            <p>
              Blocking will:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Remove them from your followers and friends</li>
              <li>Prevent messages and interactions</li>
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
              text-neutral-300
              hover:bg-neutral-800
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
                  bg-neutral-800 text-white
                  hover:bg-neutral-700
                  disabled:opacity-50
                `
            }
          >
            {loading
              ? "Working…"
              : isBlock
              ? "Block"
              : "Unblock"}
          </button>
        </div>
      </div>
    </div>
  );
}
