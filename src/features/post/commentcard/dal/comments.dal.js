import { supabase } from '@/services/supabase/supabaseClient';

export async function createComment({
  postId,
  actorId,
  content,
  parentId = null,
}) {
  const { data, error } = await supabase
    .schema('vc')
    .from('post_comments')
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

export async function deleteComment(commentId) {
  const { data, error } = await supabase
    .schema('vc')
    .from('post_comments')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select('id, deleted_at')
    .single();

  if (error) throw error;
  return data;
}
