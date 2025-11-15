// src/data/vport/vpost/roses.js
// VPORT roses wrapper: enforces that target post is a USER post.
// API preserved:
//   give({ postId, qty=1, userId, vportId })
//   count(postId)

import userRoses from '@/data/user/post/roses';
import vc from '@/lib/vcClient'; // supabase client scoped to schema 'vc'

/* ------------------------------ utils ------------------------------ */

function required(val, msg) {
  if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
    throw new Error(msg);
  }
  return val;
}

/**
 * Ensure the target post is allowed to receive roses (only USER actors).
 */
async function assertPostAcceptsRoses(postId) {
  const { data: post, error: pErr } = await vc
    .from('posts')
    .select('actor_id')
    .eq('id', postId)
    .maybeSingle();
  if (pErr) throw pErr;

  if (!post?.actor_id) return true; // legacy user-only post → allow

  const { data: actor, error: aErr } = await vc
    .from('actors')
    .select('id, kind')
    .eq('id', post.actor_id)
    .maybeSingle();
  if (aErr) throw aErr;

  if (actor?.kind === 'vport') {
    throw new Error('VPORT posts cannot receive roses.');
  }
  return true;
}

/* ------------------------------- API ------------------------------- */

export async function give({ postId, qty = 1, userId, vportId }) {
  required(postId, 'vport.roses.give: postId is required');
  required(userId,  'vport.roses.give: userId is required');
  required(vportId, 'vport.roses.give: vportId is required');

  await assertPostAcceptsRoses(postId);

  // Delegate to user DAL, but force VPORT actor semantics.
  return userRoses.give({
    postId,
    qty, // ignored by underlying DAL (schema has no qty)
    profileId: userId,
    actingAsVport: true,
    vportId,
  });
}

export async function count(postId) {
  required(postId, 'vport.roses.count: postId is required');
  return userRoses.count(postId);
}

const vpostRoses = { give, count };
export default vpostRoses;
