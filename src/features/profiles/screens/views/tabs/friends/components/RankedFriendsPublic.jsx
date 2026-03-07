// ============================================================
//  FRIENDS SYSTEM — PUBLIC TOP FRIENDS VIEW (ACTOR-BASED)
// ------------------------------------------------------------
//  @System: FriendsModule
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Public Top 10 Friends list
//    • Actor-based presentation only
// ------------------------------------------------------------
//  RULES:
//   • actorId is the ONLY identity input
//   • Presentation resolved via actor store
//   • No DB calls
//   • No hydration here
// ============================================================

import { useActorSummary } from "@/state/actors/useActorSummary";
import ActorLink from "@/shared/components/ActorLink";

/**
 * PROPS
 * ------------------------------------------------------------
// * actorIds   uuid[]   (ranked, ordered, max 10)
// * isPrivate  boolean
// * isMe       boolean
// * onEdit     fn()
 */
export default function RankedFriendsPublic({
  actorIds = [],
  isPrivate = false,
  isMe = false,
  onEdit,
}) {
  /* ============================================================
     PRIVATE STATE
     ============================================================ */
  if (isPrivate) {
    return (
      <div className="profiles-subcard p-4 text-center text-slate-300/80">
        This user's Top Friends list is private.
      </div>
    );
  }

  /* ============================================================
     EMPTY STATE — NOT SET (INTENTIONAL)
     ============================================================ */
  if (!actorIds.length) {
    return (
      <div className="profiles-friends-section space-y-4 mt-6">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">
            Top Friends
          </h3>

          {isMe && typeof onEdit === "function" && (
            <button
              onClick={onEdit}
              className="profiles-pill-btn text-xs px-3 py-1"
            >
              Edit
            </button>
          )}
        </div>

        <div className="profiles-subcard py-8 px-4 text-center text-slate-300/70 text-sm">
          This user hasn’t selected their Top Friends yet.
        </div>
      </div>
    );
  }

  /* ============================================================
     VISIBLE FRIENDS (MAX 10)
     ============================================================ */
  const visibleActorIds = actorIds.slice(0, 10);

  return (
    <div className="profiles-friends-section space-y-4 mt-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">
          Top Friends
        </h3>

        {isMe && typeof onEdit === "function" && (
          <button
            onClick={onEdit}
            className="profiles-pill-btn text-xs px-3 py-1"
          >
            Edit
          </button>
        )}
      </div>

      {/* ================= RANKED LIST ================= */}
      <div className="space-y-2">
        {visibleActorIds.map((actorId, index) => (
          <RankRow
            key={actorId}
            index={index + 1}
            actorId={actorId}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   RANK ROW — SAFE HOOK USAGE
   ============================================================ */
function RankRow({ index, actorId }) {
  const actor = useActorSummary(actorId);

  if (!actor?.actorId) return null;

  return (
    <div
      className="profiles-friend-rank-row flex items-center gap-3 p-2.5 rounded-lg"
    >
      {/* Rank number */}
      <div className="profiles-friend-rank-number w-7 text-xs text-center">
        {index}
      </div>

      {/* Actor */}
      <ActorLink
        actor={actor}
        avatarSize="w-9 h-9"
        avatarShape="rounded-md"
        showUsername
        className="flex-1"
      />
    </div>
  );
}
