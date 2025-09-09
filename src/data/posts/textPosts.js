// src/data/posts/textPosts.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Create a TEXT-ONLY post for the given actor.
 * DB: uses RPC create_post(_actor_id, _title, _body, _media_url, _media_type, _tags, _visibility, _category, _post_type)
 * media_url = null, media_type = null
 */
export async function createTextPost({
  actorId,                 // REQUIRED (actors.id for user or vport)
  title = null,
  body = '',
  tags = [],               // string[] (already normalized, optional)
  visibility = 'public',   // 'public' | 'friends' | 'subscribers' | 'close_friends'
  category = null,
  postType = 'POST',
}) {
  if (!actorId) throw new Error('createTextPost: actorId is required');

  const _tags = Array.isArray(tags)
    ? tags.map(String).map(t => t.trim()).filter(Boolean).slice(0, 50)
    : [];

  const { data, error } = await supabase.rpc('create_post', {
    _actor_id: actorId,
    _title: title || null,
    _body: body || '',
    _media_url: null,
    _media_type: null,      // <- IMPORTANT for text-only
    _tags,
    _visibility: visibility || 'public',
    _category: category || null,
    _post_type: postType || 'POST',
  });

  if (error) throw error;
  return data; // created row
}
