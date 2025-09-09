// src/data/blocks.js
import { supabase } from '@/lib/supabaseClient';

// --- utils ----------------------------------------------------
function normalizeUsername(s = '') {
  return s.trim().replace(/^@/, '');
}

// --- core API -------------------------------------------------

/** List people I (userId) have blocked, with basic profile info. */
export async function listBlockedByMe({ userId }) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_blocks')
    .select(`
      blocker_id,
      blocked_id,
      created_at,
      blocked:profiles!user_blocks_blocked_id_fkey (
        id, display_name, username, photo_url
      )
    `)
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(r => ({
    blocked_id: r.blocked_id,
    created_at: r.created_at,
    profile: r.blocked ?? null,
  }));
}

/** Block a user by id. Idempotent via upsert. */
export async function blockByUserId({ blockerId, blockedId }) {
  if (!blockerId || !blockedId) throw new Error('blockByUserId: blockerId/blockedId required');
  if (blockerId === blockedId) return true; // no-op

  const { error } = await supabase
    .from('user_blocks')
    .upsert(
      {
        blocker_id: blockerId,
        blocked_id: blockedId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true },
    );

  // Ignore duplicate errors from race-y double clicks.
  if (error && error.code !== '23505') throw error;
  return true;
}

/** Block by @username (case-insensitive). */
export async function blockByUsername({ blockerId, username }) {
  if (!blockerId || !username) throw new Error('blockByUsername: blockerId/username required');
  const uname = normalizeUsername(username);

  const { data: u, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', uname)
    .maybeSingle();

  if (error) throw error;
  if (!u?.id) throw new Error('User not found');

  return blockByUserId({ blockerId, blockedId: u.id });
}

/** Unblock a user (by id). */
export async function unblock({ blockerId, blockedId }) {
  if (!blockerId || !blockedId) throw new Error('unblock: blockerId/blockedId required');

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error) throw error;
  return true;
}

/** Quick existence check (viewer has blocked target). */
export async function isBlocked({ viewerId, targetUserId }) {
  if (!viewerId || !targetUserId) return false;

  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', viewerId)
    .eq('blocked_id', targetUserId)
    .maybeSingle();

  // PGRST116 = no rows
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/** Reverse-direction check: did target block viewer? */
export async function isBlockedByTarget({ viewerId, targetUserId }) {
  if (!viewerId || !targetUserId) return false;

  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', targetUserId)
    .eq('blocked_id', viewerId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/**
 * Check both directions in a single round-trip.
 * Returns { aBlocksB, bBlocksA, any }
 */
export async function isBlockedEitherWay({ aUserId, bUserId }) {
  if (!aUserId || !bUserId) return { aBlocksB: false, bBlocksA: false, any: false };
  if (aUserId === bUserId) return { aBlocksB: false, bBlocksA: false, any: false };

  // single query, two AND branches
  const orFilter =
    `and(blocker_id.eq.${aUserId},blocked_id.eq.${bUserId}),` +
    `and(blocker_id.eq.${bUserId},blocked_id.eq.${aUserId})`;

  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocker_id,blocked_id')
    .or(orFilter);

  if (error) throw error;

  let aBlocksB = false;
  let bBlocksA = false;

  for (const r of data || []) {
    if (r.blocker_id === aUserId && r.blocked_id === bUserId) aBlocksB = true;
    if (r.blocker_id === bUserId && r.blocked_id === aUserId) bBlocksA = true;
  }

  return { aBlocksB, bBlocksA, any: aBlocksB || bBlocksA };
}

/** True only if both directions are blocked. */
export async function isMutuallyBlocked({ aUserId, bUserId }) {
  const res = await isBlockedEitherWay({ aUserId, bUserId });
  return res.aBlocksB && res.bBlocksA;
}

export default {
  listBlockedByMe,
  blockByUserId,
  blockByUsername,
  unblock,
  isBlocked,
  isBlockedByTarget,
  isBlockedEitherWay,
  isMutuallyBlocked,
};
