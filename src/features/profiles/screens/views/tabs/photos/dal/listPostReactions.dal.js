import { supabase } from "@/services/supabase/supabaseClient";

/**
 * ============================================================
 * DAL: listPostReactions
 * ------------------------------------------------------------
 * Returns raw reaction rows for a set of post IDs
 *
 * Question answered:
 *   "What reactions exist in the database for these posts?"
 *
 * 🚫 No business logic
 * 🚫 No aggregation meaning
 * 🚫 No actor interpretation
 * ============================================================
 */

/**
 * @param {string[]} postIds
 * @returns {Promise<Array<{ post_id: string, actor_id: string, reaction: string }>>}
 */
export async function listPostReactions(postIds) {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("post_reactions")
    .select(
      `
        post_id,
        actor_id,
        reaction
      `
    ) // 🚫 no select('*')
    .in("post_id", postIds);

  if (error) {
    throw error;
  }

  // Raw rows only — no mapping, no meaning
  return data ?? [];
}
