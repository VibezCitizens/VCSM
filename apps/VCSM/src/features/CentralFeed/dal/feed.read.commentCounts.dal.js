// src/features/CentralFeed/dal/feed.read.commentCounts.dal.js
// ============================================================
// Batched comment counts for a set of post IDs.
// Returns Map<postId, number>
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * @param {string[]} postIds
 * @returns {Promise<Map<string, number>>}
 */
export async function readCommentCountsBatch(postIds) {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return new Map();
  }

  // Select only post_id column for matching comments, then count per post in JS.
  // This is a single query replacing N individual count queries.
  const { data: rows, error } = await supabase
    .schema("vc")
    .from("post_comments")
    .select("post_id")
    .in("post_id", postIds)
    .is("deleted_at", null);

  if (error) throw error;

  const counts = new Map();
  for (const row of rows || []) {
    const pid = row.post_id;
    counts.set(pid, (counts.get(pid) || 0) + 1);
  }

  return counts;
}
