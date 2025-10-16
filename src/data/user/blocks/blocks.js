// src/data/user/blocks/blocks.js
// Adapter that maps UI-facing helpers to your existing DAL in src/data/user/blocks.js

import { supabase } from '@/lib/supabaseClient';
import { vc } from '@/lib/vcClient';
import coreDefault from '@/data/user/blocks'; // your file exporting { blocks: { ... } } or default blocks

// Normalize the core export
const core = coreDefault?.block ? coreDefault
           : coreDefault?.blocks ? coreDefault.blocks
           : coreDefault;

/** Block a user by profile id (delegates to core.block) */
export async function blockUser(blockedId, { reason = null } = {}) {
  if (!core?.block) throw new Error('blocksCore.block not found');
  return core.block(blockedId, reason);
}

/** Unblock a user by profile id (delegates to core.unblock) */
export async function unblockUser(blockedId) {
  if (!core?.unblock) throw new Error('blocksCore.unblock not found');
  return core.unblock(blockedId);
}

/** Is viewer blocking profile? (delegates to core.isBlocked) */
export async function isBlocking(viewerId, profileId) {
  if (!profileId || !viewerId) return false;
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  if (!uid || uid !== viewerId) return false; // no peeking for others
  if (!core?.isBlocked) throw new Error('blocksCore.isBlocked not found');
  return core.isBlocked(profileId);
}

/** Is viewer blocked by profile? (direct table check) */
export async function isBlockedBy(viewerId, profileId) {
  if (!profileId || !viewerId) return false;
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  if (!uid || uid !== viewerId) return false;

  const { data: rows, error } = await vc
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', profileId)
    .eq('blocked_id', viewerId)
    .limit(1);

  if (error) return false;
  return (rows?.length ?? 0) > 0;
}

/** Any block either direction between aId and bId? */
export async function hasBlockEitherDirection(aId, bId) {
  if (!aId || !bId) return false;
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  if (!uid || uid !== aId) return false;

  const { data: rows, error } = await vc
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`and(blocker_id.eq.${aId},blocked_id.eq.${bId}),and(blocker_id.eq.${bId},blocked_id.eq.${aId})`);
  if (error) return false;
  return (rows?.length ?? 0) > 0;
}

/* --------------------- UI compatibility wrappers --------------------- */

/** UI expects: db.blocks.list({ userId }) -> array of profile rows for users I blocked */
export async function list({ userId, limit = 100 } = {}) {
  // your core returns blocked_id list for the current session user
  const rows = await (core?.listMyBlocks
    ? core.listMyBlocks({ limit })
    : (async () => {
        const { data: auth } = await supabase.auth.getUser();
        const blockerId = auth?.user?.id;
        if (!blockerId) return [];
        const { data, error } = await vc
          .from('user_blocks')
          .select('blocked_id')
          .eq('blocker_id', blockerId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        return data ?? [];
      })());

  const ids = Array.from(new Set((rows ?? []).map(r => r.blocked_id))).filter(Boolean);
  if (ids.length === 0) return [];

  // enrich with profiles for display
  const { data: profs, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, photo_url')
    .in('id', ids);
  if (error) throw error;

  return (profs ?? []).sort((a, b) =>
    (a.display_name || a.username || '').localeCompare(b.display_name || b.username || '')
  );
}

/** UI expects: db.blocks.blockByUsername({ blockerId, username }) -> boolean created? */
export async function blockByUsername({ blockerId, username, reason = null }) {
  const raw = (username || '').trim().replace(/^@/, '');
  if (!raw) return false;

  // Resolve username (case-insensitive)
  const { data: target, error: eFind } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', raw)
    .maybeSingle();
  if (eFind) throw eFind;
  if (!target?.id || target.id === blockerId) return false;

  // already blocked?
  const { data: existing, error: eExists } = await vc
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', target.id)
    .maybeSingle();
  if (eExists && eExists.code !== 'PGRST116') throw eExists;
  if (existing) return false;

  // delegate to core.block (uses session auth)
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
  // UI compat:
  list,
  blockByUsername,
};

export default blocks;
