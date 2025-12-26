// src/features/post/dal/postReactions.write.dal.js
// ============================================================
// Post Reactions — WRITE DAL
// - RAW mutations only
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Insert a reaction
 */
export async function insertReactionDAL({ postId, actorId, reaction }) {
  return supabase
    .schema("vc")
    .from("post_reactions")
    .insert({
      post_id: postId,
      actor_id: actorId,
      reaction,
    });
}

/**
 * Update a reaction
 */
export async function updateReactionDAL({ postId, actorId, reaction }) {
  return supabase
    .schema("vc")
    .from("post_reactions")
    .update({
      reaction,
      updated_at: new Date().toISOString(),
    })
    .eq("post_id", postId)
    .eq("actor_id", actorId);
}

/**
 * Delete a reaction
 */
export async function deleteReactionDAL({ postId, actorId }) {
  return supabase
    .schema("vc")
    .from("post_reactions")
    .delete()
    .eq("post_id", postId)
    .eq("actor_id", actorId);
}
