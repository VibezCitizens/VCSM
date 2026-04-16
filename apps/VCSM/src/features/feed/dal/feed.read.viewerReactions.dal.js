// src/features/feed/dal/feed.read.viewerReactions.dal.js
// ============================================================
// Batched viewer reactions for a set of post IDs.
// Returns Map<postId, string> (postId -> reaction kind)
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * @param {{ postIds: string[], actorId: string }} params
 * @returns {Promise<Map<string, string>>}
 */
export async function readViewerReactionsBatch({ postIds, actorId }) {
  if (!actorId || !Array.isArray(postIds) || postIds.length === 0) {
    return new Map();
  }

  const { data: rows, error } = await supabase
    .schema("vc")
    .from("post_reactions")
    .select("post_id, reaction")
    .in("post_id", postIds)
    .eq("actor_id", actorId);

  if (error) throw error;

  const reactions = new Map();
  for (const row of rows || []) {
    reactions.set(row.post_id, row.reaction);
  }

  return reactions;
}
