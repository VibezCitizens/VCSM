// src/features/post/commentcard/dal/comments.dal.js
import { supabase } from "@/services/supabase/supabaseClient";

export async function createComment({
  postId,
  actorId,
  content,
  parentId = null,
}) {
  const { data, error } = await supabase
    .schema("vc")
    .from("post_comments")
    .insert({
      post_id: postId,
      actor_id: actorId,
      content,
      parent_id: parentId,
    })
    .select(`
      id,
      post_id,
      parent_id,
      actor_id,
      content,
      created_at,
      deleted_at
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Edit comment content (owner-only)
 * Uses actor_id owner gate
 * (Your table does NOT have edited_at)
 */
export async function updateCommentContentDAL({ actorId, commentId, content }) {
  if (!actorId) throw new Error("updateCommentContentDAL: actorId required");
  if (!commentId) throw new Error("updateCommentContentDAL: commentId required");

  return supabase
    .schema("vc")
    .from("post_comments")
    .update({
      content,
    })
    .eq("id", commentId)
    .eq("actor_id", actorId) // ✅ owner gate
    .select(`id, actor_id, content`)
    .maybeSingle();
}

/**
 * Soft delete comment (owner-only)
 * (Your table does NOT have deleted_by_actor_id)
 */
export async function softDeleteCommentDAL({ actorId, commentId }) {
  if (!actorId) throw new Error("softDeleteCommentDAL: actorId required");
  if (!commentId) throw new Error("softDeleteCommentDAL: commentId required");

  return supabase
    .schema("vc")
    .from("post_comments")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("actor_id", actorId) // ✅ owner gate
    .select(`id, deleted_at`)
    .maybeSingle();
}

/**
 * Optional legacy function (no owner gate).
 * Keep only if older code still calls it.
 */
export async function deleteComment(commentId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("post_comments")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .select("id, deleted_at")
    .single();

  if (error) throw error;
  return data;
}
