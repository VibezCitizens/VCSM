// ============================================================
//  BLOCK SYSTEM — SIDE EFFECTS (ACTOR-BASED)
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

export async function applyBlockSideEffects(
  blockerActorId,
  blockedActorId
) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("applyBlockSideEffects: actorIds required");
  }

  if (blockerActorId === blockedActorId) {
    return;
  }

  /* ============================================================
     REMOVE FOLLOW RELATIONSHIPS (BIDIRECTIONAL)
     ============================================================ */

  await supabase
    .schema("vc")
    .from("actor_follows")
    .delete()
    .or(
      `and(follower_actor_id.eq.${blockerActorId},followed_actor_id.eq.${blockedActorId}),and(follower_actor_id.eq.${blockedActorId},followed_actor_id.eq.${blockerActorId})`
    );

  /* ============================================================
     REMOVE FRIEND RANKS (BIDIRECTIONAL)
     ============================================================ */

  await supabase
    .schema("vc")
    .from("friend_ranks")
    .delete()
    .or(
      `and(owner_actor_id.eq.${blockerActorId},friend_actor_id.eq.${blockedActorId}),and(owner_actor_id.eq.${blockedActorId},friend_actor_id.eq.${blockerActorId})`
    );
}
