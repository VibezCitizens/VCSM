// src/data/user/blocks.js
// Core actor-based block module (final correct version)

import { vc } from '@/lib/vcClient';
import { supabase } from '@/lib/supabaseClient';

/* -------------------------------------------------------------------------- */
/*                     SESSION + ACTOR RESOLUTION HELPERS                     */
/* -------------------------------------------------------------------------- */

export async function getSessionActorId() {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;

  const { data } = await vc
    .from('actor_owners')
    .select('actor_id')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.actor_id ?? null;
}

/** Convert profile_id or vport_id → actor_id (optional helper) */
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
/*                             BLOCK (ACTOR → ACTOR)                          */
/* -------------------------------------------------------------------------- */

export async function block({ blockerActorId, blockedActorId, reason = null }) {
  if (!blockerActorId) throw new Error('Missing blockerActorId');
  if (!blockedActorId) throw new Error('Missing blockedActorId');
  if (blockerActorId === blockedActorId) throw new Error('Cannot block self');

  const { error } = await vc.from('user_blocks').insert({
    blocker_actor_id: blockerActorId,
    blocked_actor_id: blockedActorId,
    reason,
  });

  if (error && !error.message?.includes('duplicate key')) {
    console.error('[block] error:', error);
    throw new Error('Failed to block user');
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/*                           UNBLOCK (ACTOR → ACTOR)                          */
/* -------------------------------------------------------------------------- */

export async function unblock({ blockerActorId, blockedActorId }) {
  if (!blockerActorId || !blockedActorId)
    throw new Error('Missing actor IDs for unblock');

  const { error } = await vc
    .from('user_blocks')
    .delete()
    .match({
      blocker_actor_id: blockerActorId,
      blocked_actor_id: blockedActorId,
    });

  if (error) {
    console.error('[unblock] error:', error);
    throw new Error('Failed to unblock user');
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/*                          CHECKS (ACTOR → ACTOR)                            */
/* -------------------------------------------------------------------------- */

export async function isBlocked(blockerActorId, blockedActorId) {
  if (!blockerActorId || !blockedActorId) return false;

  const { data } = await vc
    .from('user_blocks')
    .select('id')
    .eq('blocker_actor_id', blockerActorId)
    .eq('blocked_actor_id', blockedActorId)
    .limit(1);

  return data?.length > 0;
}

export async function isBlockedBy(blockedActorId, blockerActorId) {
  if (!blockerActorId || !blockedActorId) return false;

  const { data } = await vc
    .from('user_blocks')
    .select('id')
    .eq('blocker_actor_id', blockerActorId)
    .eq('blocked_actor_id', blockedActorId)
    .limit(1);

  return data?.length > 0;
}

/* -------------------------------------------------------------------------- */
/*                      BIDIRECTIONAL CHECK (CHAT SAFE)                       */
/* -------------------------------------------------------------------------- */

export async function hasBlockEitherDirectionActors(aActorId, bActorId) {
  if (!aActorId || !bActorId) return false;

  const { data } = await vc
    .from('user_blocks')
    .select('blocker_actor_id, blocked_actor_id')
    .or(
      `and(blocker_actor_id.eq.${aActorId},blocked_actor_id.eq.${bActorId}),
       and(blocker_actor_id.eq.${bActorId},blocked_actor_id.eq.${aActorId})`
    );

  return (data?.length ?? 0) > 0;
}

/* -------------------------------------------------------------------------- */
/*                       LIST MY BLOCKS (ACTOR → ACTOR)                       */
/* -------------------------------------------------------------------------- */

export async function listMyBlocks({ limit = 100 } = {}) {
  const actorId = await getSessionActorId();
  if (!actorId) return [];

  const { data, error } = await vc
    .from('user_blocks')
    .select('blocked_actor_id, created_at, reason')
    .eq('blocker_actor_id', actorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/* -------------------------------------------------------------------------- */
/*                                 EXPORT                                      */
/* -------------------------------------------------------------------------- */

const blocksCore = {
  getSessionActorId,
  getActorIdByAnyId,

  block,
  unblock,

  isBlocked,
  isBlockedBy,
  hasBlockEitherDirectionActors,
  listMyBlocks,
};

export default blocksCore;
