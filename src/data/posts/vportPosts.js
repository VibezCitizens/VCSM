// src/data/posts/vportPosts.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Create a VPORT-authored post.
 * Params: { vportId, createdByUserId, title?, text?, media_type?='text', media_url?='', tags?=[] }
 */
export async function create({
  vportId,
  createdByUserId,
  title = null,
  text = '',
  media_type = 'text',
  media_url = '',
  tags = [],
}) {
  if (!vportId) throw new Error('vportPosts.create: vportId is required');
  if (!createdByUserId) throw new Error('vportPosts.create: createdByUserId is required');

  const row = {
    user_id: null,
    vport_id: vportId,
    created_by: createdByUserId, // manager user who posted on behalf of vport
    title,
    text,
    media_type,
    media_url,
    tags,
  };

  const { data, error } = await supabase
    .from('posts')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Hard delete a VPORT post. (Switch to soft delete if you prefer.)
 */
export async function hardDelete(postId) {
  if (!postId) throw new Error('vportPosts.hardDelete: postId is required');
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
  return true;
}

export default { create, hardDelete };
