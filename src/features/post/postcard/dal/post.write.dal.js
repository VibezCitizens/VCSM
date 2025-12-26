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
