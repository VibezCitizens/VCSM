// src/features/profiles/screens/views/tabs/photos/dal/listPostReactions.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

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
    .select("post_id, actor_id, reaction")
    .in("post_id", postIds);

  if (error) throw error;
  return data ?? [];
}
