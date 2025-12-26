// src/features/post/dal/postReactions.read.dal.js
// ============================================================
// Post Reactions — READ DAL
// - RAW database reads only
// - NO business logic
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Get this actor's reaction to a post
 * RAW ROW ONLY
 */
export async function fetchActorReactionDAL({ postId, actorId }) {
  if (!postId || !actorId) {
    return { data: null, error: null };
  }

  return supabase
    .schema("vc")
    .from("post_reactions")
    .select("reaction")
    .eq("post_id", postId)
    .eq("actor_id", actorId)
    .maybeSingle();
}

/**
 * Get aggregated reaction counts (RAW RPC rows)
 */
export async function fetchReactionSummaryDAL(postId) {
  if (!postId) {
    return { data: [], error: null };
  }

  return supabase
    .schema("vc")
    .rpc("post_reactors_summary_one", {
      post_id: postId,
    });
}
