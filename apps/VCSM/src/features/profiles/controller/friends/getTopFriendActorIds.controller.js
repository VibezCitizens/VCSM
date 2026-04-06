import { filterBlockedActors } from "@/features/block";
import {
  readActiveFollowRows,
  readActorRows,
  readFriendRankRows,
} from "@/features/profiles/dal/friends/friends.read.dal";
import { reconcileFriendRanks } from "@/features/profiles/dal/friends/friendRanks.reconcile.dal";

function normalizeRankIds(rows = [], limit = 10) {
  const safeLimit = Math.max(1, Math.min(10, Number(limit || 10)));
  const ids = [];
  const seen = new Set();

  for (const row of Array.isArray(rows) ? rows : []) {
    const id = row?.friend_actor_id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= safeLimit) break;
  }

  return ids;
}

export async function getTopFriendActorIdsController({
  ownerActorId,
  limit = 10,
  reconcile = false,
  autofill = true,
} = {}) {
  if (!ownerActorId) {
    return {
      ok: false,
      error: { message: "Missing ownerActorId" },
      data: { actorIds: [] },
    };
  }

  const safeLimit = Math.max(1, Math.min(10, Number(limit || 10)));

  try {
    let rankRows = [];

    if (reconcile) {
      try {
        rankRows = await reconcileFriendRanks(ownerActorId, {
          autofill,
          maxCount: safeLimit,
        });
      } catch (reconcileError) {
        console.warn("[getTopFriendActorIdsController] reconcile fallback -> raw read", {
          ownerActorId,
          message: reconcileError?.message ?? null,
          code: reconcileError?.code ?? null,
          details: reconcileError?.details ?? null,
          hint: reconcileError?.hint ?? null,
        });
      }
    }

    if (!rankRows.length) {
      rankRows = await readFriendRankRows(ownerActorId, safeLimit);
    }

    const candidateIds = normalizeRankIds(rankRows, safeLimit);
    if (!candidateIds.length) {
      return {
        ok: true,
        error: null,
        data: { actorIds: [] },
      };
    }

    const [followRows, actorRows, blockedSet] = await Promise.all([
      readActiveFollowRows(ownerActorId, candidateIds),
      readActorRows(candidateIds),
      filterBlockedActors(ownerActorId, candidateIds),
    ]);

    const activeFollowSet = new Set(
      (followRows ?? []).map((row) => row?.followed_actor_id).filter(Boolean)
    );
    const activeActorSet = new Set(
      (actorRows ?? [])
        .filter((row) => row?.id && row?.is_void !== true)
        .map((row) => row.id)
    );

    const actorIds = candidateIds.filter(
      (id) =>
        id &&
        id !== ownerActorId &&
        activeFollowSet.has(id) &&
        activeActorSet.has(id) &&
        !blockedSet.has(id)
    );

    return {
      ok: true,
      error: null,
      data: { actorIds },
    };
  } catch (error) {
    return {
      ok: false,
      error,
      data: { actorIds: [] },
    };
  }
}
