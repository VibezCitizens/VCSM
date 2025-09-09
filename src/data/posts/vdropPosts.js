// src/data/posts/vdropPosts.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Create a VDROP (video) post for the given actor.
 */
export async function createVdropPost({
  actorId,               // REQUIRED
  title = null,
  body = '',
  mediaUrl,              // REQUIRED (video)
  tags = [],
  visibility = 'public',
  category = null,
  postType = 'VDROP',    // default to 'VDROP'
}) {
  if (!actorId) throw new Error('createVdropPost: actorId is required');
  if (!mediaUrl) throw new Error('createVdropPost: mediaUrl is required');

  const _tags = Array.isArray(tags)
    ? tags.map(String).map(t => t.trim()).filter(Boolean).slice(0, 50)
    : [];

  const { data, error } = await supabase.rpc('create_post', {
    _actor_id: actorId,
    _title: title || null,
    _body: body || '',
    _media_url: mediaUrl,
    _media_type: 'video',
    _tags,
    _visibility: visibility || 'public',
    _category: category || null,
    _post_type: postType || 'VDROP',
  });

  if (error) throw error;
  return data;
}
