// src/data/posts/reactions.js
// Unified reactions over post_reactions_unified (post_id, actor_id, type)
import { supabase } from '@/lib/supabaseClient';
import { resolveActorId } from '@/lib/actor';

/**
 * Upsert a reaction for a post (user or vport actor).
 * Params:
 *   postId: string
 *   kind: 'like' | 'dislike'
 *   userId: string (viewer profile id)
 *   actingAsVport?: boolean
 *   vportId?: string (when acting as vport)
 *
 * NOTE: authorType is ignored now; actor is determined by actingAsVport/vportId.
 */
export async function setForPost({
  postId,
  kind,
  userId,
  actingAsVport = false,
  vportId = null,
}) {
  if (!postId || !kind || !userId) throw new Error('setForPost: postId, kind, userId required');

  const actorId = await resolveActorId({ actingAsVport, profileId: userId, vportId });

  // idempotent upsert on (post_id, actor_id)
  const { data, error } = await supabase
    .from('post_reactions_unified')
    .upsert(
      [{ post_id: postId, actor_id: actorId, type: kind }],
      { onConflict: 'post_id,actor_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * List reactions for a post, normalized: 
 *  { id, post_id, actor_id, type, created_at, updated_at }
 */
export async function listForPost({ postId }) {
  if (!postId) throw new Error('listForPost: postId required');
  const { data, error } = await supabase
    .from('post_reactions_unified')
    .select('id,post_id,actor_id,type,created_at,updated_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Clear the caller’s reaction on a post (by actor).
 */
export async function clearForPost({
  postId,
  userId,
  actingAsVport = false,
  vportId = null,
}) {
  if (!postId || !userId) throw new Error('clearForPost: postId,userId required');
  const actorId = await resolveActorId({ actingAsVport, profileId: userId, vportId });

  const { error } = await supabase
    .from('post_reactions_unified')
    .delete()
    .eq('post_id', postId)
    .eq('actor_id', actorId);

  if (error) throw error;
  return true;
}

export default { setForPost, listForPost, clearForPost };
