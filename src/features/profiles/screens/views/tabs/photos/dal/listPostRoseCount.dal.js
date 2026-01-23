import { supabase } from "@/services/supabase/supabaseClient";

/**
 * ============================================================
 * DAL: listPostRoseCount
 * ------------------------------------------------------------
 * Returns raw rose gift totals per post_id
 *
 * Question answered:
 *   "What does the database say about how many roses
 *    exist for each post?"
 *
 * 🚫 No business logic
 * 🚫 No actor meaning
 * 🚫 No permissions
 * ============================================================
 */

/**
 * @param {string[]} postIds
 * @returns {Promise<Record<string, number>>}
 */
export async function listPostRoseCount(postIds) {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("post_rose_gifts")
    .select("post_id, qty")
    .in("post_id", postIds);

  if (error) {
    throw error;
  }

  const counts = {};
  for (const row of data ?? []) {
    counts[row.post_id] = (counts[row.post_id] || 0) + Number(row.qty || 0);
  }

  return counts;
}
