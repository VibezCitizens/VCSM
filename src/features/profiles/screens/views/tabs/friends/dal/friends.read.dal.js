import { supabase } from "@/services/supabase/supabaseClient";

// 🔒 BLOCK READ GATE (SSOT)
import { filterBlockedActors } from "@/features/block/dal/block.read.dal";

/* ============================================================
   TOP FRIENDS (BLOCK-SAFE)
   ============================================================ */
/**
 * Fetch top-ranked friends for an actor
 * - Order preserved
 * - Blocked actors removed (bi-directional)
 *
 * @param {string} ownerActorId
 * @param {number} limit
 * @returns {string[]} friendActorIds
 */
export async function fetchTopFriendActorIds(ownerActorId, limit = 9) {
  if (!ownerActorId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("friend_ranks")
    .select("friend_actor_id")
    .eq("owner_actor_id", ownerActorId)
    .order("rank", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const ids = data?.map((r) => r.friend_actor_id) ?? [];
  if (!ids.length) return [];

  // ------------------------------------------------------------
  // 🔒 BLOCK FILTER (NO LEAKS)
  // ------------------------------------------------------------
  const blockedSet = await filterBlockedActors(ownerActorId, ids);

  return ids.filter((id) => !blockedSet.has(id));
}

/* ============================================================
   FOLLOW GRAPH (RAW — BLOCK FILTERED BY CALLER)
   ============================================================ */
/**
 * Fetch follow graph for an actor
 *
 * NOTE:
 * - This returns RAW graph data
 * - Blocking is applied by higher-level hooks
 *
 * @param {string} actorId
 * @returns {{
 *   following: Set<string>,
 *   followers: Set<string>
 * }}
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
    following: new Set(following?.map((r) => r.followed_actor_id)),
    followers: new Set(followers?.map((r) => r.follower_actor_id)),
  };
}
