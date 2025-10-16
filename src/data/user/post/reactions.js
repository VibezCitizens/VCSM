// src/data/user/post/reactions.js
// Actor-based reactions DAL (👍 / 👎).
// - Uses vc.post_reactions with (post_id, actor_id, type, qty)
// - Toggle semantics via unique index on (post_id, actor_id, type) for like|dislike
// - Roses are handled in roses.js (unlimited), not here.

import supabase from '@/lib/supabaseClient';
import { getCurrentActorId } from '@/lib/actors/actors';

const LD = ['like', 'dislike'];

/** Fetch reactions for a post (returns all types; UI filters as needed). */
export async function listForPost({ postId }) {
  if (!postId) return [];
  const { data, error } = await supabase
    .schema('vc')
    .from('post_reactions')
    .select('id, post_id, actor_id, user_id, type, qty, created_at')
    .eq('post_id', postId);

  if (error) throw error;

  return (data || []).map((r) => ({
    id: r.id,
    post_id: r.post_id,
    actor_id: r.actor_id || null, // actor-based path (new)
    user_id: r.user_id || null,   // legacy fallback (old rows)
    reaction: r.type,             // 'like' | 'dislike' | 'rose'
    qty: r.qty ?? 1,
    created_at: r.created_at,
  }));
}

/**
 * Set (toggle) a reaction for the current identity to 'like' or 'dislike'.
 * No UPSERT (avoids partial-index conflict mismatch).
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

  // 1) Do we already have a like/dislike row for this actor on this post?
  const { data: existing, error: selErr } = await supabase
    .schema('vc')
    .from('post_reactions')
    .select('id, type')
    .eq('post_id', postId)
    .eq('actor_id', actorId)
    .in('type', LD)
    .maybeSingle();
  if (selErr && selErr.code !== 'PGRST116') throw selErr;

  if (existing?.id) {
    // 2a) Row exists: switch type if different
    if (existing.type !== kind) {
      const { error: upErr } = await supabase
        .schema('vc')
        .from('post_reactions')
        .update({ type: kind })
        .eq('id', existing.id);
      if (upErr) throw upErr;
    }
    return { id: existing.id, type: kind };
  }

  // 2b) No row: insert new
  const { data: row, error: insErr } = await supabase
    .schema('vc')
    .from('post_reactions')
    .insert({ post_id: postId, actor_id: actorId, type: kind, qty: 1 })
    .select('id, type')
    .maybeSingle();
  if (insErr) throw insErr;
  return row || null;
}

/**
 * Clear the current identity’s like/dislike for a post.
 * If `kind` is provided, clears just that; otherwise clears both.
 */
export async function clearForPost({
  postId,
  userId,
  kind,                 // optional: 'like' | 'dislike' | 'rose'
  actingAsVport = false,
  vportId = null,
}) {
  if (!postId) throw new Error('clearForPost: postId is required');

  const actorId = await getCurrentActorId({
    userId,
    activeVportId: actingAsVport ? vportId : null,
  });
  if (!actorId) return;

  let q = supabase
    .schema('vc')
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('actor_id', actorId);

  if (kind) q = q.eq('type', kind);
  else q = q.in('type', LD);

  const { error } = await q;
  if (error) throw error;
}

/** Optional helper: returns 'like' | 'dislike' | null for current identity. */
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
    .select('type')
    .eq('post_id', postId)
    .eq('actor_id', actorId)
    .in('type', LD)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.type ?? null;
}

const reactionsApi = {
  listForPost,
  setForPost,
  clearForPost,
  getMyReactionForPost,
};
export default reactionsApi;
