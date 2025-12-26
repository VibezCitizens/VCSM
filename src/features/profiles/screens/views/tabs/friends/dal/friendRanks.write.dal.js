import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Replace all top-friend ranks atomically
 * @param {string} ownerActorId
 * @param {string[]} friendActorIds ordered list
 */
export async function saveFriendRanks(ownerActorId, friendActorIds = []) {
  if (!ownerActorId) throw new Error("ownerActorId required");

  const payload = friendActorIds.map((friendActorId, i) => ({
    owner_actor_id: ownerActorId,
    friend_actor_id: friendActorId,
    rank: i + 1,
  }));

  // wipe existing
  const { error: delErr } = await supabase
    .schema("vc")
    .from("friend_ranks")
    .delete()
    .eq("owner_actor_id", ownerActorId);

  if (delErr) throw delErr;

  // insert new
  if (payload.length > 0) {
    const { error: insErr } = await supabase
      .schema("vc")
      .from("friend_ranks")
      .insert(payload);

    if (insErr) throw insErr;
  }
}
