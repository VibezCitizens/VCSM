// src/features/post/postcard/dal/roseGifts.actor.dal.js
// ============================================================
// Rose Gifts DAL (STRICT)
// - RAW database access only
// - NO aggregation
// - NO domain meaning
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * List rose gift rows for a post
 * RAW ROWS ONLY
 */
export async function listRoseGiftsByPostDAL(postId) {
  if (!postId) {
    return { data: [], error: null };
  }

  return supabase
    .schema("vc")
    .from("post_rose_gifts")
    .select("qty")
    .eq("post_id", postId);
}

/**
 * Insert a rose gift row
 * RAW INSERT RESULT
 */
export async function insertRoseGiftDAL({ postId, actorId, qty }) {
  if (!postId) throw new Error("postId is required");
  if (!actorId) throw new Error("actorId is required");
  if (!qty || qty <= 0) throw new Error("qty must be > 0");

  return supabase
    .schema("vc")
    .from("post_rose_gifts")
    .insert({
      post_id: postId,
      actor_id: actorId,
      qty,
    });
}
