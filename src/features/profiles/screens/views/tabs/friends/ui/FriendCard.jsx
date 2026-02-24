// ============================================================
//  FRIEND CARD — COMPACT GRID CARD (ACTOR-BASED)
// ------------------------------------------------------------
//  @System: FriendsModule
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Used in Top Friends (3x3 grid)
//    • Symmetrical, fixed-height
//    • Actor-store driven
// ------------------------------------------------------------
//  RULES:
//   • actorId is the ONLY identity input
//   • No DB calls here
//   • No layout variance
// ============================================================

import { useActorSummary } from "@/state/actors/useActorSummary";
import ActorLink from "@/shared/components/ActorLink";

export default function FriendCard({ actorId }) {
  const actor = useActorSummary(actorId);
  if (!actor?.actorId) return null;

  return (
    <ActorLink
      actor={actor}
      className="
        group
        rounded-xl
        bg-neutral-900
        border border-neutral-800
        p-3
        text-center
        transition
        hover:bg-neutral-800
        hover:border-neutral-700
        active:scale-[0.98]
      "
    >
      {/* Avatar */}
      <div className="flex justify-center">
        <img
          src={actor.avatar}
          alt={actor.displayName}
          className="
            w-16 h-16
            rounded-lg
            object-cover
            bg-neutral-800
          "
        />
      </div>

      {/* Name */}
      <div className="mt-2">
        <p className="text-sm font-medium text-white truncate">
          {actor.displayName}
        </p>

        {actor.username && (
          <p className="text-xs text-neutral-400 truncate">
            @{actor.username}
          </p>
        )}
      </div>
    </ActorLink>
  );
}
