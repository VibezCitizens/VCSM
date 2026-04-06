// ============================================================
//  PROFILE — FRIEND ITEM (ACTOR-BASED)
// ------------------------------------------------------------
//  @System: FriendsModule
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope: Single friend row (actor SSOT)
// ------------------------------------------------------------
//  RULES:
//   • Receives ONLY actorId
//   • Resolves presentation via actor store
//   • Never touches profile / vport directly
//   • Safe hook usage (no conditional hooks)
// ============================================================

import { useActorSummary } from "@/state/actors/useActorSummary";
import ActorLink from "@/shared/components/ActorLink";

export default function ProfileFriendItem({ actorId }) {
  // 🔒 Actor presentation is resolved here
  const actor = useActorSummary(actorId);

  if (!actor?.actorId) return null;

  return (
    <div className="profiles-friend-item profiles-friend-rank-row">
      <ActorLink
        actor={actor}
        avatarSize="w-10 h-10"
        avatarShape="rounded-lg"
        showUsername
        className="min-w-0"
      />
    </div>
  );
}
