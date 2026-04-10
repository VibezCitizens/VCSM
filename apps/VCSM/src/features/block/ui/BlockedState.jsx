// ============================================================
//  BLOCK SYSTEM — BLOCKED STATE (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: BlockedState.jsx
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Generic UI shown when content is blocked
//    • Used across profile / friends / chat / feed
// ------------------------------------------------------------
//  RULES:
//   • Actor-based only
//   • UI-only (no DB, no hooks)
//   • Parent decides WHEN to render this
// ============================================================

import { Lock } from "lucide-react";
import ActorLink from "@/shared/components/ActorLink";
import { useActorSummary } from "@hydration";

/**
 * PROPS
 * ------------------------------------------------------------
 * actorId     uuid   (the actor being blocked or blocking)
 * label       string (optional override message)
 * showLink    boolean (default false)
 */
export default function BlockedState({
  actorId,
  label = "This content is unavailable due to blocking.",
  showLink = false,
}) {
  const actor = useActorSummary(actorId);

  return (
    <div
      className="
        flex flex-col items-center justify-center
        gap-3
        py-10
        px-4
        text-center
        rounded-xl
        border border-white/10
        bg-white/4/60
      "
    >
      {/* Icon */}
      <Lock className="w-6 h-6 text-white/40" />

      {/* Message */}
      <p className="text-sm text-white/50 max-w-sm">
        {label}
      </p>

      {/* Optional actor link */}
      {showLink && actorId && (
        <div className="mt-1">
          <ActorLink
            actor={actor}
            avatarSize="w-8 h-8"
            showUsername
            className="justify-center"
          />
        </div>
      )}
    </div>
  );
}
