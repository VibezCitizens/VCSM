// ============================================================
//  BLOCK SYSTEM — WRITE DAL (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: block.write.dal.js
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Block / unblock actors
//    • Actor-only identity (SSOT)
//    • Safe for UI + guards
// ------------------------------------------------------------
//  RULES:
//   • actorId is the ONLY identity
//   • No UI logic
//   • No hooks
//   • RLS enforced at DB level
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/* ============================================================
   BLOCK ACTOR
   ============================================================ */

/**
 * Block another actor
 *
 * Safe to call multiple times (idempotent)
 *
 * @param {string} blockerActorId
 * @param {string} blockedActorId
 */
export async function blockActor(
  blockerActorId,
  blockedActorId
) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("blockActor: actorIds required");
  }

  if (blockerActorId === blockedActorId) {
    throw new Error("blockActor: cannot block self");
  }

  const { error } = await supabase
    .schema("vc")
    .from("user_blocks")
    .insert({
      blocker_actor_id: blockerActorId,
      blocked_actor_id: blockedActorId,
    });

  // Ignore duplicate insert (idempotent)
  if (error && error.code !== "23505") {
    console.error("[blockActor] failed:", error);
    throw error;
  }
}

/* ============================================================
   UNBLOCK ACTOR
   ============================================================ */

/**
 * Unblock an actor
 *
 * Safe even if no row exists
 *
 * @param {string} blockerActorId
 * @param {string} blockedActorId
 */
export async function unblockActor(
  blockerActorId,
  blockedActorId
) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("unblockActor: actorIds required");
  }

  const { error } = await supabase
    .schema("vc")
    .from("user_blocks")
    .delete()
    .eq("blocker_actor_id", blockerActorId)
    .eq("blocked_actor_id", blockedActorId);

  if (error) {
    console.error("[unblockActor] failed:", error);
    throw error;
  }
}

/* ============================================================
   TOGGLE BLOCK (UI HELPER)
   ============================================================ */

/**
 * Toggle block state
 *
 * @param {boolean} isBlocked
 * @param {string} blockerActorId
 * @param {string} blockedActorId
 */
export async function toggleBlockActor(
  isBlocked,
  blockerActorId,
  blockedActorId
) {
  if (isBlocked) {
    await unblockActor(blockerActorId, blockedActorId);
  } else {
    await blockActor(blockerActorId, blockedActorId);
  }
}
