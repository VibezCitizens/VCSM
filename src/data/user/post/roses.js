// src/data/user/post/roses.js
// Unlimited 🌹 per actor per post.
// Table: vc.post_reactions { id, post_id, actor_id, user_id?, type, qty, created_at }
// We write rows with type='rose' and qty >= 1 (no unique constraint).

import supabase from '@/lib/supabaseClient';
import { getCurrentActorId } from '@/lib/actors/actors';

/** Return total roses (sum of qty) for a post. */
export async function count(postId) {
  if (!postId) return 0;

  const { data, error } = await supabase
    .schema('vc')
    .from('post_reactions')
    .select('qty')
    .eq('post_id', postId)
    .eq('type', 'rose');

  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return rows.reduce((sum, r) => sum + (Number(r.qty) || 0), 0);
}

/**
 * Give roses to a post (INSERT; no upsert).
 * @param {Object} opts
 * @param {string} opts.postId            - target post id (required)
 * @param {number} [opts.qty=1]           - number of roses to give (>=1)
 * @param {string} [opts.profileId]       - current profile id (if omitted, resolved from session)
 * @param {boolean} [opts.actingAsVport]  - if true, prefer active vport actor (future-ready)
 * @param {string} [opts.vportId=null]    - explicit vport id when acting as vport
 * @param {string} [opts.actorId]         - override resolved actor id (advanced)
 */
export async function give({
  postId,
  qty = 1,
  profileId,
  actingAsVport = false,
  vportId = null,
  actorId: actorOverride,
} = {}) {
  if (!postId) throw new Error('roses.give: postId is required');

  // sanitize qty
  const n = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;

  // resolve actor_id (user actor today; vport later)
  const actorId =
    actorOverride ||
    (await getCurrentActorId({
      userId: profileId,
      activeVportId: actingAsVport ? vportId : null,
    }));

  if (!actorId) throw new Error('roses.give: no actor_id for current identity');

  const payload = {
    post_id: postId,
    actor_id: actorId,
    type: 'rose',
    qty: n,
  };

  const { data, error } = await supabase
    .schema('vc')
    .from('post_reactions')
    .insert(payload)
    .select('id, post_id, actor_id, type, qty, created_at')
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

const rosesApi = {
  count,
  give,
};
export default rosesApi;
