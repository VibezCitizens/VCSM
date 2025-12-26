// src/features/post/commentcard/dal/comments.read.dal.js
// ============================================================================
// PURE READ DAL — Post Comments
// ============================================================================

import { supabase } from '@/services/supabase/supabaseClient';

/* -------------------------------------------------------------------------- */
/*                               TOP-LEVEL COMMENTS                           */
/* -------------------------------------------------------------------------- */

export async function listTopLevel({ postId }) {
  if (!postId) return [];

  const { data, error } = await supabase
    .schema('vc')
    .from('post_comments')
    .select(`
      id,
      post_id,
      parent_id,
      actor_id,
      content,
      created_at,
      deleted_at
    `)
    .eq('post_id', postId)
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/* -------------------------------------------------------------------------- */
/*                                   REPLIES                                  */
/* -------------------------------------------------------------------------- */

export async function listReplies({ parentId }) {
  if (!parentId) return [];

  const { data, error } = await supabase
    .schema('vc')
    .from('post_comments')
    .select(`
      id,
      post_id,
      parent_id,
      actor_id,
      content,
      created_at,
      deleted_at
    `)
    .eq('parent_id', parentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
