import { supabase } from "@/services/supabase/supabaseClient";

function clampTopFriendLimit(limit = 10) {
  return Math.max(1, Math.min(10, Number(limit || 10)));
}

/**
 * Raw ranked rows for one owner.
 * Returns DB rows only; no eligibility or block filtering.
 */
export async function readFriendRankRows(ownerActorId, limit = 10) {
  if (!ownerActorId) return [];

  const safeLimit = clampTopFriendLimit(limit);
  const { data, error } = await supabase
    .schema("vc")
    .from("friend_ranks")
    .select("owner_actor_id,friend_actor_id,rank")
    .eq("owner_actor_id", ownerActorId)
    .order("rank", { ascending: true })
    .limit(safeLimit);

  if (error) throw error;
  return data ?? [];
}

/**
 * Raw active follow edges for an owner against provided ids.
 */
export async function readActiveFollowRows(ownerActorId, friendActorIds = []) {
  const ids = Array.isArray(friendActorIds) ? friendActorIds.filter(Boolean) : [];
  if (!ownerActorId || !ids.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_follows")
    .select("follower_actor_id,followed_actor_id,is_active")
    .eq("follower_actor_id", ownerActorId)
    .eq("is_active", true)
    .in("followed_actor_id", ids);

  if (error) throw error;
  return data ?? [];
}

/**
 * Raw actor rows for ids.
 */
export async function readActorRows(actorIds = []) {
  const ids = Array.isArray(actorIds) ? actorIds.filter(Boolean) : [];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,is_void")
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}

/* ============================================================
   FOLLOW GRAPH
   ============================================================ */
/**
 * Fetch follow graph for an actor.
 * This helper shape is kept for existing friends tab consumers.
 */
export async function fetchFollowGraph(actorId) {
  if (!actorId) {
    return {
      following: new Set(),
      followers: new Set(),
    };
  }

  const [{ data: following }, { data: followers }] = await Promise.all([
    supabase
      .schema("vc")
      .from("actor_follows")
      .select("followed_actor_id")
      .eq("follower_actor_id", actorId)
      .eq("is_active", true),

    supabase
      .schema("vc")
      .from("actor_follows")
      .select("follower_actor_id")
      .eq("followed_actor_id", actorId)
      .eq("is_active", true),
  ]);

  return {
    following: new Set((following ?? []).map((row) => row.followed_actor_id)),
    followers: new Set((followers ?? []).map((row) => row.follower_actor_id)),
  };
}
