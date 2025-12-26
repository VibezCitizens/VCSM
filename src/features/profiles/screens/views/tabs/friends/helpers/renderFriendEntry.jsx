// ============================================================
//  FRIENDS SYSTEM — RENDER FRIEND ENTRY (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: renderFriendEntry.jsx
//  @System: FriendsModule
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Render a single friend row
//    • Actor-only identity (SSOT)
// ------------------------------------------------------------
//  RULES:
//   • Input = actorId ONLY
//   • UI resolves data from actor store
//   • NO profile / vport branching
//   • NO hooks
// ============================================================

import ActorLink from "@/shared/components/ActorLink";

/**
 * Render a single friend entry
 *
 * @param {string} actorId
 */
export default function renderFriendEntry(actorId) {
  if (!actorId) return null;

  return (
    <ActorLink
      actorId={actorId}
      avatarSize="w-10 h-10"
      avatarShape="rounded-md"
      showUsername
      className="min-w-0 flex-1"
    />
  );
}
