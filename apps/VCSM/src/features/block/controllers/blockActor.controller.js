// ============================================================
//  BLOCK SYSTEM — CONTROLLER (ACTOR-BASED)
// ------------------------------------------------------------
//  Uses moderation.block_actor / moderation.unblock_actor RPCs.
//  Follow deactivation is handled server-side by the RPC.
//  friend_ranks cleanup: pending batch4 migration deployment.
// ============================================================

import {
  blockActor as blockActorDAL,
  unblockActor as unblockActorDAL,
} from "@/features/block/dal/block.write.dal";

import { checkBlockStatus } from "@/features/block/dal/block.check.dal";

/**
 * Block an actor.
 * Idempotent — checks current status before calling RPC.
 * RPC handles: moderation.blocks upsert, block_event, follow deactivation.
 */
export async function blockActorController(blockerActorId, blockedActorId, assertingActorId) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("blockActorController: actorIds required");
  }
  if (blockerActorId === blockedActorId) {
    throw new Error("blockActorController: cannot block self");
  }
  if (!assertingActorId || assertingActorId !== blockerActorId) {
    throw new Error("blockActorController: session actor does not match blocker");
  }

  const { blockedByMe } = await checkBlockStatus(blockerActorId, blockedActorId);

  if (!blockedByMe) {
    await blockActorDAL(blockerActorId, blockedActorId);
  }

  return { blocked: true };
}

/**
 * Unblock an actor.
 * Verifies the caller owns the block edge before proceeding.
 * Does NOT restore follows or friend ranks.
 */
export async function unblockActorController(blockerActorId, blockedActorId, assertingActorId) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("unblockActorController: actorIds required");
  }
  if (!assertingActorId || assertingActorId !== blockerActorId) {
    throw new Error("unblockActorController: session actor does not match blocker");
  }

  // Ownership check — caller must be the blocker
  const { blockedByMe } = await checkBlockStatus(blockerActorId, blockedActorId);
  if (!blockedByMe) {
    return { blocked: false }; // idempotent: block doesn't exist, nothing to do
  }

  await unblockActorDAL(blockerActorId, blockedActorId);

  return { blocked: false };
}

/**
 * Toggle block state with full business guarantees.
 */
export async function toggleBlockActorController(blockerActorId, blockedActorId, assertingActorId) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("toggleBlockActorController: actorIds required");
  }
  if (!assertingActorId || assertingActorId !== blockerActorId) {
    throw new Error("toggleBlockActorController: session actor does not match blocker");
  }

  const { blockedByMe } = await checkBlockStatus(blockerActorId, blockedActorId);

  if (blockedByMe) {
    await unblockActorDAL(blockerActorId, blockedActorId);
    return { blocked: false };
  }

  await blockActorDAL(blockerActorId, blockedActorId);
  return { blocked: true };
}
