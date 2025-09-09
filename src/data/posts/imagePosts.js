// src/data/posts/imagePosts.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Create an IMAGE post for the given actor.
 * Use after you have mediaUrl from your uploader (Cloudflare, etc).
 */
export async function createImagePost({
  actorId,               // REQUIRED
  title = null,
  body = '',
  mediaUrl,              // REQUIRED
  tags = [],
  visibility = 'public',
  category = null,
  postType = 'POST',
}) {
  if (!actorId) throw new Error('createImagePost: actorId is required');
  if (!mediaUrl) throw new Error('createImagePost: mediaUrl is required');

  const _tags = Array.isArray(tags)
    ? tags.map(String).map(t => t.trim()).filter(Boolean).slice(0, 50)
    : [];

  const { data, error } = await supabase.rpc('create_post', {
    _actor_id: actorId,
    _title: title || null,
    _body: body || '',
    _media_url: mediaUrl,
    _media_type: 'image',
    _tags,
    _visibility: visibility || 'public',
    _category: category || null,
    _post_type: postType || 'POST',
  });

  if (error) throw error;
  return data;
}
