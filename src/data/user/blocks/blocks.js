// src/data/user/blocks/blocks.js
// Adapter that maps UI-facing helpers to the core in src/data/user/blocks.js

import { supabase } from '@/lib/supabaseClient';
import { vc } from '@/lib/vcClient';
import coreDefault from '@/data/user/blocks'; // <- core DAL

// Normalize the core export into an object with {block,unblock,isBlocked,listMyBlocks}
const core =
  coreDefault?.block ? coreDefault :
  coreDefault?.blocks ? coreDefault.blocks :
  coreDefault;

async function getSessionUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

/** Block a user by profile id */
export async function blockUser(blockedId, { reason = null } = {}) {
  try {
    if (!core?.block) throw new Error('blocksCore.block not found');
    return await core.block(blockedId, reason);
  } catch (e) {
    console.error('[blocks.adapter] blockUser failed:', e);
    throw e;
  }
}

/** Unblock a user by profile id */
export async function unblockUser(blockedId) {
  try {
    if (!core?.unblock) throw new Error('blocksCore.unblock not found');
    return await core.unblock(blockedId);
  } catch (e) {
    console.error('[blocks.adapter] unblockUser failed:', e);
    throw e;
  }
}

/** Is viewer blocking profile? (session viewer only) */
export async function isBlocking(viewerId, profileId) {
  if (!profileId || !viewerId) return false;
  const uid = await getSessionUserId();
  if (!uid || uid !== viewerId) return false; // no peeking for others
  if (!core?.isBlocked) throw new Error('blocksCore.isBlocked not found');
  return core.isBlocked(profileId);
}

/** Is viewer blocked by profile? (direct check via legacy columns for convenience) */
export async function isBlockedBy(viewerId, profileId) {
  if (!profileId || !viewerId) return false;
  const uid = await getSessionUserId();
  if (!uid || uid !== viewerId) return false;

  const { data, error } = await vc
    .from('user_blocks')
    .select('blocker_id')
    .eq('blocker_id', profileId)
    .eq('blocked_id', viewerId)
    .limit(1); // array read (avoid maybeSingle)

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

/** Any block either direction between two profile IDs */
export async function hasBlockEitherDirection(aId, bId) {
  if (!aId || !bId) return false;
  const uid = await getSessionUserId();
  if (!uid || uid !== aId) return false;

  const { data, error } = await vc
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(
      `and(blocker_id.eq.${aId},blocked_id.eq.${bId}),and(blocker_id.eq.${bId},blocked_id.eq.${aId})`
    );

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

/** NEW: Any block either direction between two ACTOR IDs */
export async function hasActorBlockEitherDirection(aActorId, bActorId) {
  if (!aActorId || !bActorId) return false;
  if (!core?.hasBlockEitherDirectionActors) {
    throw new Error('blocksCore.hasBlockEitherDirectionActors not found');
  }
  return core.hasBlockEitherDirectionActors(aActorId, bActorId);
}

/* --------------------- UI compatibility wrappers --------------------- */

/** db.blocks.list({ userId }) -> array of profile rows for users I blocked */
export async function list({ userId, limit = 100 } = {}) {
  const rows = await (core?.listMyBlocks
    ? core.listMyBlocks({ limit })
    : (async () => {
        const blockerId = await getSessionUserId();
        if (!blockerId) return [];
        const { data, error } = await vc
          .from('user_blocks')
          .select('blocked_id, created_at')
          .eq('blocker_id', blockerId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        return data ?? [];
      })());

  const ids = Array.from(new Set((rows ?? []).map(r => r.blocked_id))).filter(Boolean);
  if (ids.length === 0) return [];

  const { data: profs, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, photo_url')
    .in('id', ids);
  if (error) throw error;

  return (profs ?? []).sort((a, b) =>
    (a.display_name || a.username || '').localeCompare(b.display_name || b.username || '')
  );
}

/** db.blocks.blockByUsername({ blockerId, username }) -> boolean created? */
export async function blockByUsername({ blockerId, username, reason = null }) {
  const raw = (username || '').trim().replace(/^@/, '');
  if (!raw) return false;

  // Avoid maybeSingle: limit(1) array read
  const { data: targets, error: eFind } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', raw)
    .limit(1);
  if (eFind) throw eFind;

  const target = Array.isArray(targets) ? targets[0] : null;
  if (!target?.id || target.id === blockerId) return false;

  const { data: existing, error: eExists } = await vc
    .from('user_blocks')
    .select('blocker_id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', target.id)
    .limit(1);
  if (eExists) throw eExists;
  if (Array.isArray(existing) && existing.length > 0) return false;

  if (!core?.block) throw new Error('blocksCore.block not found');
  await core.block(target.id, reason);
  return true;
}

const blocks = {
  blockUser,
  unblockUser,
  isBlocking,
  isBlockedBy,
  hasBlockEitherDirection,
  hasActorBlockEitherDirection,
  list,
  blockByUsername,
};

export default blocks;
