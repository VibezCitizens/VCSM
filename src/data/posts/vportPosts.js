// src/data/posts/vportPosts.js
import { supabase } from '@/lib/supabaseClient';

/** Normalize tags into a compact text[] */
function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags
      .map(String)
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  return String(tags)
    .split(/[,\s]+/)
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 50);
}

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
    title: title ?? null,
    text: text ?? '',
    media_type: media_type ?? 'text',
    media_url: media_url ?? '',
    tags: normalizeTags(tags),
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
 * Soft delete a VPORT post (marks deleted=true and bumps updated_at).
 */
export async function softDelete(postId) {
  if (!postId) throw new Error('vportPosts.softDelete: postId is required');

  const { error } = await supabase
    .from('posts')
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) throw error;
  return true;
}

/**
 * Back-compat alias for prior hard delete API.
 * Now performs a soft delete for consistency with user posts.
 */
export async function hardDelete(postId) {
  return softDelete(postId);
}

export default { create, softDelete, hardDelete };
