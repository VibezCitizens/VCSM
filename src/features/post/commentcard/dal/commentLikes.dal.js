// src/features/post/commentcard/dal/commentLikes.dal.js
// ============================================================
// Comment Likes DAL (LEGACY STYLE, ACTOR-SAFE)
// - Composite PK (comment_id, actor_id)
// - NO id column
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

export async function isCommentLiked({ commentId, actorId }) {
  if (!commentId || !actorId) return false;

  const { data, error } = await supabase
    .schema("vc")
    .from("comment_likes")
    .select("comment_id") // ✅ MUST be an existing column
    .eq("comment_id", commentId)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function likeComment({ commentId, actorId }) {
  if (!commentId || !actorId) return;

  const { error } = await supabase
    .schema("vc")
    .from("comment_likes")
    .insert({
      comment_id: commentId,
      actor_id: actorId,
    });

  if (error) throw error;
}

export async function unlikeComment({ commentId, actorId }) {
  if (!commentId || !actorId) return;

  const { error } = await supabase
    .schema("vc")
    .from("comment_likes")
    .delete()
    .eq("comment_id", commentId)
    .eq("actor_id", actorId);

  if (error) throw error;
}

export async function getCommentLikeCount(commentId) {
  if (!commentId) return 0;

  const { count, error } = await supabase
    .schema("vc")
    .from("comment_likes")
    .select("comment_id", { count: "exact", head: true }) // ✅ existing column
    .eq("comment_id", commentId);

  if (error) throw error;
  return count ?? 0;
}
