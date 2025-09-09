// src/data/posts/userPosts.js
import { supabase } from '@/lib/supabaseClient';

/** Normalize tags into a compact text[] */
function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags
      .map(String)
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 50); // hard cap to avoid huge payloads
  }
  // Support comma/space-delimited strings just in case
  return String(tags)
    .split(/[,\s]+/)
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 50);
}

/**
 * Create a USER-authored post (vport_id=null).
 * Returns the created row.
 */
export async function create({
  userId,
  title = null,
  text = '',
  media_type = 'text',
  media_url = '',
  tags = [],
}) {
  if (!userId) throw new Error('userPosts.create: userId is required');

  const safeTags = normalizeTags(tags);

  const row = {
    user_id: userId,
    vport_id: null,            // explicit: USER-authored post
    title: title ?? null,
    text: text ?? '',
    media_type: media_type ?? 'text',
    media_url: media_url ?? '',
    tags: safeTags,            // text[]
    // leave visibility/like_count/etc. to DB defaults
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
 * Soft-delete a post (marks deleted=true).
 */
export async function softDelete(postId) {
  if (!postId) throw new Error('userPosts.softDelete: postId is required');

  const { error } = await supabase
    .from('posts')
    .update({ deleted: true, updated_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) throw error;
  return true;
}

export default { create, softDelete };
