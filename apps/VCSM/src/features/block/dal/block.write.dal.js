// ============================================================
//  BLOCK SYSTEM — WRITE DAL (ACTOR-BASED)
// ------------------------------------------------------------
//  Uses moderation.block_actor / moderation.unblock_actor RPCs.
//  All side effects (block_events, follow deactivation) are
//  handled server-side in the RPCs.
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Block another actor via RPC.
 * Server-side: inserts/reactivates moderation.blocks, inserts block_event,
 * deactivates vc.actor_follows in the blocked direction.
 * Idempotent — re-blocking an already-blocked actor reactivates the row.
 */
export async function blockActor(blockerActorId, blockedActorId, reason = null) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("blockActor: actorIds required");
  }
  if (blockerActorId === blockedActorId) {
    throw new Error("blockActor: cannot block self");
  }

  const { error } = await supabase
    .schema("moderation")
    .rpc("block_actor", {
      p_blocker_actor_id: blockerActorId,
      p_blocked_actor_id: blockedActorId,
      p_reason: reason,
    });

  if (error) {
    console.error("[blockActor] RPC failed:", error);
    throw error;
  }
}

/**
 * Unblock an actor via RPC.
 * Server-side: sets moderation.blocks status='released', inserts unblock event.
 */
export async function unblockActor(blockerActorId, blockedActorId, reason = null) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("unblockActor: actorIds required");
  }

  const { error } = await supabase
    .schema("moderation")
    .rpc("unblock_actor", {
      p_blocker_actor_id: blockerActorId,
      p_blocked_actor_id: blockedActorId,
      p_reason: reason,
    });

  if (error) {
    console.error("[unblockActor] RPC failed:", error);
    throw error;
  }
}

/**
 * Toggle block state.
 */
export async function toggleBlockActor(isBlocked, blockerActorId, blockedActorId) {
  if (isBlocked) {
    await unblockActor(blockerActorId, blockedActorId);
  } else {
    await blockActor(blockerActorId, blockedActorId);
  }
}
