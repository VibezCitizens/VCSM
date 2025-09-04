// src/data/blocks.js
import { supabase } from '@/lib/supabaseClient';

// --- utils ----------------------------------------------------
const normUsername = (s='') => s.trim().replace(/^@/, '');

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
  if (!blockerId || !blockedId) throw new Error('Missing blockerId/blockedId');
  if (blockerId === blockedId) return true; // no-op
  const { error } = await supabase
    .from('user_blocks')
    .upsert(
      { blocker_id: blockerId, blocked_id: blockedId },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
    );
  if (error && error.code !== '23505') throw error;
  return true;
}

/** Block by @username (case-insensitive). */
export async function blockByUsername({ blockerId, username }) {
  if (!blockerId || !username) throw new Error('Missing blockerId/username');
  const uname = normUsername(username);
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
  if (!blockerId || !blockedId) throw new Error('Missing blockerId/blockedId');
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
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export default {
  listBlockedByMe,
  blockByUserId,
  blockByUsername,
  unblock,
  isBlocked,
};
