// ============================================================
//  FRIENDS SYSTEM — RANK PICKER MODAL (ACTOR-BASED)
// ------------------------------------------------------------
//  @System: FriendsModule
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Pick an actor to add into Top Friends ranking
//    • Only actors the owner already follows
//    • BLOCK-SAFE (bi-directional)
// ------------------------------------------------------------
//  RULES:
//   • actorId is the ONLY identity
//   • No DB writes here
//   • No profile/vport branching
//   • Presentation via actor store
// ============================================================

import { useEffect, useState } from "react";

import { fetchFollowGraph } from "../dal/friends.read.dal";
import { hydrateActorsIntoStore } from "../helpers/hydrateActorsIntoStore";

// 🔒 block system
import { filterBlockedActors } from "@/features/block/dal/block.read.dal";

import { useActorSummary } from "@/state/actors/useActorSummary";
import ActorLink from "@/shared/components/ActorLink";

/**
 * PROPS
 * ------------------------------------------------------------
 * ownerActorId  uuid
 * existingIds   uuid[]   (already ranked)
 * maxRanks      number   (default 10)
 * onSelect      fn(actorId)
 * onClose       fn()
 */
export default function RankPickerModal({
  ownerActorId,
  existingIds = [],
  maxRanks = 10,
  onSelect,
  onClose,
}) {
  const [loading, setLoading] = useState(true);
  const [candidateIds, setCandidateIds] = useState([]);

  /* ============================================================
     LOAD FOLLOWING ACTORS (BLOCK-SAFE)
     ============================================================ */
  useEffect(() => {
    if (!ownerActorId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        // --------------------------------------------------------
        // 1. Load follow graph
        // --------------------------------------------------------
        const { following } = await fetchFollowGraph(ownerActorId);
        const followingIds = [...following];

        if (!followingIds.length) {
          if (!cancelled) {
            setCandidateIds([]);
            setLoading(false);
          }
          return;
        }

        // --------------------------------------------------------
        // 2. Remove already-ranked actors
        // --------------------------------------------------------
        const notRanked = followingIds.filter(
          (id) => !existingIds.includes(id)
        );

        if (!notRanked.length) {
          if (!cancelled) {
            setCandidateIds([]);
            setLoading(false);
          }
          return;
        }

        // --------------------------------------------------------
        // 🔒 3. Block filter (bi-directional)
        // --------------------------------------------------------
        const blockedSet = await filterBlockedActors(
          ownerActorId,
          notRanked
        );

        const visible = notRanked.filter(
          (id) => !blockedSet.has(id)
        );

        if (!visible.length) {
          if (!cancelled) {
            setCandidateIds([]);
            setLoading(false);
          }
          return;
        }

        // --------------------------------------------------------
        // 4. Hydrate presentation store (SSOT)
        // --------------------------------------------------------
        await hydrateActorsIntoStore(visible);

        if (!cancelled) {
          setCandidateIds(visible.slice(0, maxRanks));
          setLoading(false);
        }
      } catch (err) {
        console.error("[RankPickerModal] failed:", err);
        if (!cancelled) {
          setCandidateIds([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerActorId, existingIds, maxRanks]);

  /* ============================================================
     UI
     ============================================================ */
  return (
    <div
      className="fixed inset-0 z-50
                 bg-black/60 backdrop-blur-sm
                 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md
                   bg-neutral-950 border border-neutral-800
                   rounded-xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- Header ---------- */}
        <header className="mb-3">
          <h3 className="text-lg font-semibold text-white">
            Add Top Friend
          </h3>
          <p className="text-xs text-neutral-400">
            Pick someone you already follow
          </p>
        </header>

        {/* ---------- States ---------- */}
        {loading && (
          <p className="text-sm text-neutral-500 py-4">
            Loading…
          </p>
        )}

        {!loading && candidateIds.length === 0 && (
          <p className="text-sm text-neutral-500 py-4">
            No available friends to add.
          </p>
        )}

        {/* ---------- List ---------- */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {candidateIds.map((actorId) => (
            <CandidateRow
              key={actorId}
              actorId={actorId}
              onPick={() => onSelect(actorId)}
            />
          ))}
        </div>

        {/* ---------- Footer ---------- */}
        <footer className="pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg
                       border border-neutral-700
                       text-neutral-300
                       hover:bg-neutral-800"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   CANDIDATE ROW — SAFE HOOK USAGE
   ============================================================ */
function CandidateRow({ actorId, onPick }) {
  const actor = useActorSummary(actorId);
  if (!actor?.actorId) return null;

  return (
    <button
      onClick={onPick}
      className="w-full flex items-center justify-between
                 p-2 rounded-lg
                 hover:bg-neutral-900 transition"
    >
      <ActorLink
        actor={actor}
        avatarSize="w-9 h-9"
        avatarShape="rounded-md"
        showUsername
      />

      <span className="text-xs text-purple-400">
        Add
      </span>
    </button>
  );
}
