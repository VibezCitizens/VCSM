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
import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";
import { readBlockActorOwnerLinkDAL } from "@/features/block/dal/blockActorOwnership.read.dal";

// V11-M1 (+ V12B-M1): canonical KIND-AGNOSTIC session→vc.actor_owners owner-bind on
// the blocker. The blocker (active identity actor) may be a user OR a vport, so neither
// kind-specific helper fits (assertSessionOwns = vport-only, assertActorOwns = user-only).
// Verifies the authenticated session owns blockerActorId via vc.actor_owners (createPost
// pattern — mirrors V06B-M1 social graph). Replaces the prior vacuous caller-equality
// (`assertingActorId === blockerActorId`, both caller-supplied → zero protection).
// Defense-in-depth over the SECURITY DEFINER block RPCs (durable boundary 11-DB-1).
async function assertSessionOwnsBlocker(blockerActorId) {
  const sessionUser = await readCurrentAuthUser();
  if (
    !sessionUser ||
    !(await readBlockActorOwnerLinkDAL({ actorId: blockerActorId, userId: sessionUser.id }))
  ) {
    throw new Error("block: session does not own the blocker actor");
  }
}

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
  // assertingActorId retained (vestigial) for API compatibility — no longer authorizes.
  if (!assertingActorId) {
    throw new Error("blockActorController: assertingActorId required");
  }
  await assertSessionOwnsBlocker(blockerActorId);

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
  // assertingActorId retained (vestigial) for API compatibility — no longer authorizes.
  if (!assertingActorId) {
    throw new Error("unblockActorController: assertingActorId required");
  }
  await assertSessionOwnsBlocker(blockerActorId);

  // Ownership check — session must own the blocker (verified above); confirm a block exists
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
  // assertingActorId retained (vestigial) for API compatibility — no longer authorizes.
  if (!assertingActorId) {
    throw new Error("toggleBlockActorController: assertingActorId required");
  }
  await assertSessionOwnsBlocker(blockerActorId);

  const { blockedByMe } = await checkBlockStatus(blockerActorId, blockedActorId);

  if (blockedByMe) {
    await unblockActorDAL(blockerActorId, blockedActorId);
    return { blocked: false };
  }

  await blockActorDAL(blockerActorId, blockedActorId);
  return { blocked: true };
}
