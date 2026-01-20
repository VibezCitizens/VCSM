// src/features/post/dal/post.write.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Create a post
 * DAL — RAW INSERT RESULT ONLY
 */
export async function createPostDAL({ actorId, text }) {
  if (!actorId) {
    throw new Error("createPostDAL: actorId required");
  }

  return supabase
    .schema("vc")
    .from("posts")
    .insert({
      actor_id: actorId,
      text,
    })
    .select(`
      id,
      actor_id,
      text,
      title,
      media_type,
      media_url,
      post_type,
      tags,
      created_at
    `)
    .maybeSingle();
}

/**
 * Edit post text (owner-only)
 * Requires vc.posts.edited_at
 */
export async function updatePostTextDAL({ actorId, postId, text }) {
  if (!actorId) throw new Error("updatePostTextDAL: actorId required");
  if (!postId) throw new Error("updatePostTextDAL: postId required");

  return supabase
    .schema("vc")
    .from("posts")
    .update({
      text,
      edited_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("actor_id", actorId) // ✅ owner gate
    .select(`id, actor_id, text, edited_at`)
    .maybeSingle();
}

/**
 * Soft delete (owner-only)
 * Requires vc.posts.deleted_at + deleted_by_actor_id
 */
export async function softDeletePostDAL({ actorId, postId }) {
  if (!actorId) throw new Error("softDeletePostDAL: actorId required");
  if (!postId) throw new Error("softDeletePostDAL: postId required");

  return supabase
    .schema("vc")
    .from("posts")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_actor_id: actorId,
    })
    .eq("id", postId)
    .eq("actor_id", actorId) // ✅ owner gate
    .select(`id, deleted_at, deleted_by_actor_id`)
    .maybeSingle();
}
