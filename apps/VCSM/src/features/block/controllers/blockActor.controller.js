// ============================================================
//  BLOCK SYSTEM — CONTROLLER (ACTOR-BASED)
// ------------------------------------------------------------
//  Uses moderation.block_actor / moderation.unblock_actor RPCs.
//  Follow deactivation is handled server-side by the RPC.
//  Friend rank cleanup remains a client-side side effect.
// ============================================================

import {
  blockActor as blockActorDAL,
  unblockActor as unblockActorDAL,
} from "@/features/block/dal/block.write.dal";

import { checkBlockStatus } from "@/features/block/dal/block.check.dal";
import { deleteFriendRankRowsBetweenActors } from "@/features/block/helpers/applyBlockSideEffects";

/**
 * Block an actor.
 * Idempotent — checks current status before calling RPC.
 * RPC handles: moderation.blocks upsert, block_event, follow deactivation.
 * Controller handles: friend_ranks cleanup (not in RPC).
 */
export async function blockActorController(blockerActorId, blockedActorId) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("blockActorController: actorIds required");
  }
  if (blockerActorId === blockedActorId) {
    throw new Error("blockActorController: cannot block self");
  }

  const { blockedByMe } = await checkBlockStatus(blockerActorId, blockedActorId);

  if (!blockedByMe) {
    await blockActorDAL(blockerActorId, blockedActorId);
    // Friend ranks not handled by RPC — clean up client-side
    try {
      await deleteFriendRankRowsBetweenActors(blockerActorId, blockedActorId);
    } catch {}
  }

  return { blocked: true };
}

/**
 * Unblock an actor.
 * Does NOT restore follows or friend ranks.
 */
export async function unblockActorController(blockerActorId, blockedActorId) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("unblockActorController: actorIds required");
  }

  await unblockActorDAL(blockerActorId, blockedActorId);
  return { blocked: false };
}

/**
 * Toggle block state with full business guarantees.
 */
export async function toggleBlockActorController(blockerActorId, blockedActorId) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("toggleBlockActorController: actorIds required");
  }

  const { blockedByMe } = await checkBlockStatus(blockerActorId, blockedActorId);

  if (blockedByMe) {
    await unblockActorDAL(blockerActorId, blockedActorId);
    return { blocked: false };
  }

  await blockActorDAL(blockerActorId, blockedActorId);
  try {
    await deleteFriendRankRowsBetweenActors(blockerActorId, blockedActorId);
  } catch {}
  return { blocked: true };
}
