import { supabase } from "@/services/supabase/supabaseClient";

/**
 * ============================================================
 * DAL: listPostCommentsCount
 * ------------------------------------------------------------
 * Returns raw comment counts per post_id
 *
 * Question answered:
 *   "What does the database say about how many comments
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
export async function listPostCommentsCount(postIds) {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("post_comments")
    .select("post_id")          // 🚫 no select('*')
    .in("post_id", postIds);

  if (error) {
    throw error;
  }

  // Raw DB aggregation (still DAL-legal)
  const counts = {};
  for (const row of data) {
    counts[row.post_id] = (counts[row.post_id] || 0) + 1;
  }

  return counts;
}
