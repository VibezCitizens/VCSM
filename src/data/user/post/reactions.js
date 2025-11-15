// src/data/user/post/reactions.js
// Actor-based reactions DAL (👍 / 👎).
// Schema: vc.post_reactions(post_id, actor_id, reaction, created_at, updated_at)
// Single row per (post_id, actor_id). 'reaction' holds 'like' | 'dislike' | 'rose' | emoji.

import supabase from '@/lib/supabaseClient';
import { getCurrentActorId } from '@/lib/actors/actors';

const LD = ['like', 'dislike'];

/** Fetch reactions for a post (returns all types; UI filters as needed). */
export async function listForPost({ postId }) {
  if (!postId) return [];
  const { data, error } = await supabase
    .schema('vc')
    .from('post_reactions')
    .select('post_id, actor_id, reaction, created_at')
    .eq('post_id', postId);

  if (error) throw error;

  // Shape compatible with existing UI (it reads `.reaction`):
  return (data || []).map((r) => ({
    post_id: r.post_id,
    actor_id: r.actor_id,
    reaction: r.reaction, // 'like' | 'dislike' | 'rose' | '🔥'...
    created_at: r.created_at,
  }));
}

/**
 * Set (toggle) a reaction for the current identity to 'like' or 'dislike'.
 * No UPSERT needed: SELECT → UPDATE/INSERT to avoid conflict surprises.
 */
export async function setForPost({
  postId,
  kind,                 // 'like' | 'dislike'
  userId,               // current profile id (optional)
  actingAsVport = false,
  vportId = null,
}) {
  if (!postId) throw new Error('setForPost: postId is required');
  if (!LD.includes(kind)) throw new Error('setForPost: kind must be "like" or "dislike"');

  const actorId = await getCurrentActorId({
    userId,
    activeVportId: actingAsVport ? vportId : null,
  });
  if (!actorId) throw new Error('setForPost: no actor for current identity');

  // Is there already a reaction row for this actor/post?
  const { data: existing, error: selErr } = await supabase
    .schema('vc')
    .from('post_reactions')
    .select('reaction')
    .eq('post_id', postId)
    .eq('actor_id', actorId)
    .maybeSingle();
  if (selErr && selErr.code !== 'PGRST116') throw selErr;

  if (existing) {
    // Switch reaction if different
    if (existing.reaction !== kind) {
      const { error: upErr } = await supabase
        .schema('vc')
        .from('post_reactions')
        .update({ reaction: kind, updated_at: new Date().toISOString() })
        .eq('post_id', postId)
        .eq('actor_id', actorId);
      if (upErr) throw upErr;
    }
    return { reaction: kind };
  }

  // No row: insert new
  const { error: insErr } = await supabase
    .schema('vc')
    .from('post_reactions')
    .insert({ post_id: postId, actor_id: actorId, reaction: kind, updated_at: new Date().toISOString() });
  if (insErr) throw insErr;
  return { reaction: kind };
}

/**
 * Clear the current identity’s like/dislike for a post.
 * With new schema there is at most ONE row → delete it.
 * If `kind` is provided, we still delete the row (it’s the same row).
 */
export async function clearForPost({
  postId,
  userId,
  kind,                 // optional: 'like' | 'dislike' | 'rose' (ignored in filter)
  actingAsVport = false,
  vportId = null,
}) {
  if (!postId) throw new Error('clearForPost: postId is required');

  const actorId = await getCurrentActorId({
    userId,
    activeVportId: actingAsVport ? vportId : null,
  });
  if (!actorId) return;

  const { error } = await supabase
    .schema('vc')
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('actor_id', actorId);

  if (error) throw error;
}

/** Returns 'like' | 'dislike' | 'rose' | null for current identity. */
export async function getMyReactionForPost({
  postId,
  userId,
  actingAsVport = false,
  vportId = null,
}) {
  if (!postId) return null;

  const actorId = await getCurrentActorId({
    userId,
    activeVportId: actingAsVport ? vportId : null,
  });
  if (!actorId) return null;

  const { data, error } = await supabase
    .schema('vc')
    .from('post_reactions')
    .select('reaction')
    .eq('post_id', postId)
    .eq('actor_id', actorId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.reaction ?? null;
}

const reactionsApi = {
  listForPost,
  setForPost,
  clearForPost,
  getMyReactionForPost,
};
export default reactionsApi;
