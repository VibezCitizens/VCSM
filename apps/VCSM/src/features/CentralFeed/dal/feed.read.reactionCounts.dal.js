// src/features/CentralFeed/dal/feed.read.reactionCounts.dal.js
// ============================================================
// Batched reaction counts for a set of post IDs.
// Returns Map<postId, { like: number, dislike: number, rose: number }>
//
// Combines data from two tables:
//   - vc.post_reactions (like/dislike)
//   - vc.post_rose_gifts (rose qty)
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * @param {string[]} postIds
 * @returns {Promise<Map<string, { like: number, dislike: number, rose: number }>>}
 */
export async function readReactionCountsBatch(postIds) {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return new Map();
  }

  // Two parallel queries: binary reactions + rose gifts
  const [reactionsResult, rosesResult] = await Promise.all([
    supabase
      .schema("vc")
      .from("post_reactions")
      .select("post_id, reaction")
      .in("post_id", postIds),
    supabase
      .schema("vc")
      .from("post_rose_gifts")
      .select("post_id, qty")
      .in("post_id", postIds),
  ]);

  if (reactionsResult.error) throw reactionsResult.error;
  if (rosesResult.error) throw rosesResult.error;

  const countsMap = new Map();

  const ensureEntry = (pid) => {
    if (!countsMap.has(pid)) {
      countsMap.set(pid, { like: 0, dislike: 0, rose: 0 });
    }
    return countsMap.get(pid);
  };

  // Tally like/dislike
  for (const row of reactionsResult.data || []) {
    const c = ensureEntry(row.post_id);
    if (row.reaction === "like") c.like += 1;
    else if (row.reaction === "dislike") c.dislike += 1;
  }

  // Tally rose qty
  for (const row of rosesResult.data || []) {
    const c = ensureEntry(row.post_id);
    c.rose += Number(row.qty) || 0;
  }

  return countsMap;
}
