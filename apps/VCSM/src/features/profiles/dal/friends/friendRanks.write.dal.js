import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Normalize incoming friend ids:
 * - remove null/undefined
 * - remove duplicates (keep first occurrence)
 * - cap to max
 */
function normalizeFriendIds(friendActorIds = [], maxCount = 10) {
  const unique = [];
  const seen = new Set();

  for (const id of Array.isArray(friendActorIds) ? friendActorIds : []) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
    if (unique.length >= maxCount) break;
  }

  return unique;
}

/**
 * Replace all top-friend ranks atomically via RPC.
 * Manual-only — no autofill from follows.
 *
 * @param {string} ownerActorId
 * @param {string[]} friendActorIds — ordered list (first = rank 1)
 * @param {{ maxCount?: number }} options
 * @returns {Promise<Array<{ owner_actor_id: string, friend_actor_id: string, rank: number }>>}
 */
export async function saveFriendRanks(
  ownerActorId,
  friendActorIds = [],
  { maxCount = 10 } = {}
) {
  if (!ownerActorId) throw new Error("ownerActorId required");

  const safeMaxCount = Math.max(1, Math.min(10, Number(maxCount || 10)));
  const normalizedIds = normalizeFriendIds(friendActorIds, safeMaxCount);

  const { data, error } = await supabase
    .schema("vc")
    .rpc("save_friend_ranks", {
      p_owner_actor_id: ownerActorId,
      p_friend_actor_ids: normalizedIds,
      p_max_count: safeMaxCount,
    });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
