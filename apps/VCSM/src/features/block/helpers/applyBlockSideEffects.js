// Block side effects that are NOT handled by the RPC.
// Follow deactivation is now server-side in moderation.block_actor RPC.
// Friend rank cleanup remains client-side.

import { supabase } from "@/services/supabase/supabaseClient";
import { assertUuid } from "@/services/supabase/postgrestSafe";

/**
 * Delete friend_ranks between two actors (bidirectional).
 * Called after a successful block to clean up the social graph.
 */
export async function deleteFriendRankRowsBetweenActors(blockerActorId, blockedActorId) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("deleteFriendRankRowsBetweenActors: actorIds required");
  }
  if (blockerActorId === blockedActorId) return;

  assertUuid(blockerActorId, "blockerActorId");
  assertUuid(blockedActorId, "blockedActorId");

  const { error } = await supabase
    .schema("vc")
    .from("friend_ranks")
    .delete()
    .or(
      `and(owner_actor_id.eq.${blockerActorId},friend_actor_id.eq.${blockedActorId}),and(owner_actor_id.eq.${blockedActorId},friend_actor_id.eq.${blockerActorId})`
    );

  if (error) throw error;
}
