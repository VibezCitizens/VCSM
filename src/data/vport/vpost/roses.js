// src/data/vport/vpost/roses.js
// Allow a VPORT to give roses, but VPORT-authored posts cannot receive roses.
//
// This is a thin wrapper around src/data/user/post/roses.js that:
//  - Forces "actingAsVport" with a required vportId for writes
//  - Checks the target post is NOT authored by a VPORT before giving
//
// Exports:
//  - give({ postId, qty=1, userId, vportId })
//  - count(postId)           // passthrough; useful for UI

import userRoses from '@/data/user/post/roses';
import vc from '@/lib/vcClient'; // supabase client already scoped to schema 'vc'

/* ------------------------------ utils ------------------------------ */

function required(val, msg) {
  if (
    val === undefined ||
    val === null ||
    (typeof val === 'string' && val.trim() === '')
  ) {
    throw new Error(msg);
  }
  return val;
}

function toPositiveInt(n, fallback = 1) {
  const x = Number(n);
  return Number.isFinite(x) && x > 0 ? Math.floor(x) : fallback;
}

/**
 * Ensure the target post is allowed to receive roses.
 * Rule: only posts authored by USER actors can receive roses.
 * Throws if the post is by a VPORT.
 */
async function assertPostAcceptsRoses(postId) {
  // 1) get post → actor_id
  const { data: post, error: pErr } = await vc
    .from('posts')
    .select('actor_id')
    .eq('id', postId)
    .maybeSingle();

  if (pErr) throw pErr;
  if (!post?.actor_id) {
    // If actor_id is missing, we assume legacy user-only post; allow roses.
    return true;
  }

  // 2) check actor kind
  const { data: actor, error: aErr } = await vc
    .from('actors')
    .select('id, kind')
    .eq('id', post.actor_id)
    .maybeSingle();

  if (aErr) throw aErr;

  if (actor?.kind === 'vport') {
    // Hard stop: VPORT-authored posts cannot receive roses
    throw new Error('VPORT posts cannot receive roses.');
  }
  return true;
}

/* ------------------------------- API ------------------------------- */

/**
 * Give roses *as a VPORT* to a post (only if that post is a USER post).
 * @param {{
 *   postId: string,
 *   qty?: number,           // default 1
 *   userId: string,         // current authed profile id
 *   vportId: string         // REQUIRED: which VPORT is acting
 * }} args
 */
export async function give({ postId, qty = 1, userId, vportId }) {
  required(postId, 'vport.roses.give: postId is required');
  required(userId,  'vport.roses.give: userId is required');
  required(vportId, 'vport.roses.give: vportId is required');

  const amount = toPositiveInt(qty, 1);

  // Enforce: target post must NOT be a VPORT post
  await assertPostAcceptsRoses(postId);

  // Delegate to user DAL, but force VPORT actor semantics
  return userRoses.give({
    postId,
    qty: amount,
    profileId: userId,
    actingAsVport: true,
    vportId,
    // userRoses.give can also take actorId; not needed here since it resolves via (userId, vportId)
  });
}

/**
 * Count roses on a post (passthrough).
 * This returns 0 for VPORT posts naturally, since none can be given.
 */
export async function count(postId) {
  required(postId, 'vport.roses.count: postId is required');
  return userRoses.count(postId);
}

/* ----------------------------- export ------------------------------ */

const vpostRoses = {
  give,
  count,
};

export default vpostRoses;
