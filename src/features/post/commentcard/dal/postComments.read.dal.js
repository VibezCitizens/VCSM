import { supabase } from "@/services/supabase/supabaseClient";

export async function listPostComments(postId) {
  if (!postId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("post_comments")
    .select(`
      id,
      post_id,
      parent_id,
      actor_id,
      content,
      created_at,
      deleted_at
    `)
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function insertPostComment({
  postId,
  actorId,
  content,
}) {
  const { data, error } = await supabase
    .schema("vc")
    .from("post_comments")
    .insert({
      post_id: postId,
      actor_id: actorId,
      content,
    })
    .select(`
      id,
      post_id,
      parent_id,
      actor_id,
      content,
      created_at
    `)
    .single();

  if (error) throw error;
  return data;
}
