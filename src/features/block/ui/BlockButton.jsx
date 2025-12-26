// ============================================================
//  BLOCK SYSTEM — BLOCK BUTTON (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: BlockButton.jsx
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Block / Unblock another actor
//    • Reflect live block status
//    • Trigger side effects (follow cleanup, etc)
// ------------------------------------------------------------
//  RULES:
//   • ActorId is the ONLY identity
//   • No direct DB calls here
//   • Uses blocking hooks only
// ============================================================

import { useMemo } from "react";

import { useIdentity } from "@/state/identity/identityContext";
import { useBlockStatus } from "@/features/block/hooks/useBlockStatus";
import { useBlockActions } from "@/features/block/hooks/useBlockActions";

/**
 * PROPS
 * ------------------------------------------------------------
 * targetActorId   uuid (actor being viewed)
 * size            "sm" | "md" | "lg"
 */
export default function BlockButton({
  targetActorId,
  size = "sm",
}) {
  const { identity } = useIdentity();
  const myActorId = identity?.actorId ?? null;

  const {
    loading,
    isBlocked,
    blockedMe,
    canInteract,
  } = useBlockStatus(myActorId, targetActorId);

  const {
    block,
    unblock,
    working,
  } = useBlockActions(myActorId, targetActorId);

  /* ============================================================
     GUARDS
     ============================================================ */

  // No self-blocking
  if (!myActorId || !targetActorId || myActorId === targetActorId) {
    return null;
  }

  // If they blocked me, I cannot interact
  if (blockedMe) {
    return (
      <button
        disabled
        className={getButtonClass(size, "disabled")}
      >
        You are blocked
      </button>
    );
  }

  if (loading) {
    return (
      <button
        disabled
        className={getButtonClass(size, "disabled")}
      >
        …
      </button>
    );
  }

  /* ============================================================
     STATE
     ============================================================ */

  const label = isBlocked ? "Unblock" : "Block";
  const onClick = isBlocked ? unblock : block;

  return (
    <button
      onClick={onClick}
      disabled={working || !canInteract}
      className={getButtonClass(
        size,
        isBlocked ? "danger-outline" : "danger"
      )}
    >
      {working ? "…" : label}
    </button>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

function getButtonClass(size, variant) {
  const base =
    "rounded-lg font-medium transition focus:outline-none";

  const sizes = {
    sm: "text-xs px-3 py-1",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };

  const variants = {
    danger: `
      bg-red-600 text-white
      hover:bg-red-500
      active:bg-red-700
    `,
    "danger-outline": `
      border border-red-500
      text-red-400
      hover:bg-red-500/10
    `,
    disabled: `
      bg-neutral-800
      text-neutral-500
      cursor-not-allowed
    `,
  };

  return [
    base,
    sizes[size] ?? sizes.sm,
    variants[variant] ?? variants.disabled,
  ].join(" ");
}
