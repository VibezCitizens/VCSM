// [CITIZEN_ONLY] — user actors only
import { ctrlGetBlockedActorSet } from "@/features/block";
import {
  readActiveFollowRows,
  readActorRows,
  readFriendRankRows,
} from "@/features/profiles/kinds/citizen/dal/friends/friends.read.dal";
import { reconcileFriendRanks } from "@/features/profiles/kinds/citizen/dal/friends/friendRanks.reconcile.dal";
import { assertActorOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

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
        // V05B-M2: reconcile RE-SAVES through vc.save_friend_ranks (a write), so the
        // reconcile branch ONLY is session-bound. The owner is always a citizen
        // (user-kind) actor — canonical USER-ONLY self-form. A non-owner throws here
        // and cleanly degrades to the ungated public read below (reconcile never
        // writes for a foreign owner). The reconcile===false read path is NEVER gated,
        // so viewing other citizens' PUBLIC Top-Friends lists keeps working.
        await assertActorOwnsActorController({
          requestActorId: ownerActorId,
          targetActorId: ownerActorId,
        });

        rankRows = await reconcileFriendRanks(ownerActorId, {
          autofill,
          maxCount: safeLimit,
        });
      } catch (reconcileError) {
        if (import.meta.env?.DEV) {
          console.warn("[getTopFriendActorIdsController] reconcile fallback -> raw read", {
            ownerActorId,
            message: reconcileError?.message ?? null,
            code: reconcileError?.code ?? null,
            details: reconcileError?.details ?? null,
            hint: reconcileError?.hint ?? null,
          });
        }
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
      ctrlGetBlockedActorSet({ actorId: ownerActorId, candidateActorIds: candidateIds }),
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
