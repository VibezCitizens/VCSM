// src/data/user/blocks/blocks.js

import { vc } from '@/lib/vcClient';
import { supabase } from '@/lib/supabaseClient';

/* -------------------------------------------------------------------------- */
/*                       🔧  Shared Actor Helper Exports                      */
/* -------------------------------------------------------------------------- */

/** Get the session user's actor_id */
export async function getSessionActorId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const { data } = await vc
    .from('actor_owners')
    .select('actor_id')
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.actor_id ?? null;
}

/** Convert profile_id or vport_id → actor_id */
export async function getActorIdByAnyId(id) {
  if (!id) return null;

  const { data } = await vc
    .from('actors')
    .select('id')
    .or(`profile_id.eq.${id},vport_id.eq.${id}`)
    .maybeSingle();

  return data?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/*                             Block User (ACTOR)                             */
/* -------------------------------------------------------------------------- */

export async function blockUser({ blockerActorId, blockedActorId, reason = null }) {
  if (!blockerActorId || !blockedActorId)
    throw new Error('Missing actor IDs for blockUser');

  const { error } = await vc.from('user_blocks').insert({
    blocker_actor_id: blockerActorId,
    blocked_actor_id: blockedActorId,
    reason,
  });

  if (error) {
    console.error('[blockUser] insert error', error);
    throw new Error('Failed to block user');
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/*                           Unblock User (ACTOR)                             */
/* -------------------------------------------------------------------------- */

export async function unblockUser({ blockerActorId, blockedActorId }) {
  if (!blockerActorId || !blockedActorId)
    throw new Error('Missing actor IDs for unblockUser');

  const { error } = await vc
    .from('user_blocks')
    .delete()
    .match({
      blocker_actor_id: blockerActorId,
      blocked_actor_id: blockedActorId,
    });

  if (error) {
    console.error('[unblockUser] delete error', error);
    throw new Error('Failed to unblock user');
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/*                            Viewer/Actor Checks                             */
/* -------------------------------------------------------------------------- */

export async function isBlocking(viewerActorId, targetActorId) {
  if (!viewerActorId || !targetActorId) return false;

  const { data } = await vc
    .from('user_blocks')
    .select('id')
    .eq('blocker_actor_id', viewerActorId)
    .eq('blocked_actor_id', targetActorId)
    .limit(1);

  return data?.length > 0;
}

export async function isBlockedBy(viewerActorId, targetActorId) {
  if (!viewerActorId || !targetActorId) return false;

  const { data } = await vc
    .from('user_blocks')
    .select('id')
    .eq('blocker_actor_id', targetActorId)
    .eq('blocked_actor_id', viewerActorId)
    .limit(1);

  return data?.length > 0;
}

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */

const blocks = {
  blockUser,
  unblockUser,
  isBlocking,
  isBlockedBy,
  getSessionActorId,
  getActorIdByAnyId,
};

export default blocks;
