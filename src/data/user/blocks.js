// src/data/user/blocks.js
// Core DAL for vc.user_blocks using actor-based PK (blocker_actor_id, blocked_actor_id).
// Accepts profile IDs (public.profiles.id) as inputs.

import { supabase } from '@/lib/supabaseClient';
import { vc } from '@/lib/vcClient';

async function getAuthUserId() {
  const { data: auth } = await supabase.auth.getUser();
  return auth?.user?.id ?? null;
}

async function getMyActorId(userId) {
  if (!userId) return null;
  const { data, error } = await vc
    .from('actor_owners')
    .select('actor_id')
    .eq('user_id', userId)
    .limit(1);

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : null;
  return row?.actor_id ?? null;
}

async function getActorIdByProfileId(profileId) {
  if (!profileId) return null;
  const { data, error } = await vc
    .from('actors')
    .select('id')
    .eq('profile_id', profileId)
    .limit(1);

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : null;
  return row?.id ?? null;
}

const core = {
  /**
   * Block a profile (blockedId is public.profiles.id).
   * Returns: { blocker_actor_id, blocked_actor_id, blocker_id, blocked_id, created_at }
   */
  async block(blockedId, _reason = null) {
    if (!blockedId) throw new Error('blocks.block: blockedId required');

    const userId = await getAuthUserId();
    if (!userId) throw new Error('blocks.block: auth required');

    const [blockerActorId, blockedActorId] = await Promise.all([
      getMyActorId(userId),
      getActorIdByProfileId(blockedId),
    ]);
    if (!blockerActorId) throw new Error('blocks.block: no actor for current user');
    if (!blockedActorId) throw new Error('blocks.block: target profile has no actor');

    const payload = {
      blocker_actor_id: blockerActorId,
      blocked_actor_id: blockedActorId,
      // legacy back-fill (nullable in schema; helpful for old UI/reporting)
      blocker_id: userId,
      blocked_id: blockedId,
    };

    // Upsert WITHOUT inline .select() to avoid PGRST116 if legacy dupes exist.
    const { error: upsertErr } = await vc
      .from('user_blocks')
      .upsert([payload], {
        onConflict: 'blocker_actor_id,blocked_actor_id',
        ignoreDuplicates: true,
      });
    if (upsertErr) throw upsertErr;

    // Deterministic read: fetch exactly one row even if legacy dupes exist.
    const { data, error } = await vc
      .from('user_blocks')
      .select('blocker_actor_id, blocked_actor_id, blocker_id, blocked_id, created_at')
      .eq('blocker_actor_id', blockerActorId)
      .eq('blocked_actor_id', blockedActorId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : null;

    return (
      row ?? {
        blocker_actor_id: blockerActorId,
        blocked_actor_id: blockedActorId,
        blocker_id: userId,
        blocked_id: blockedId,
        created_at: new Date().toISOString(),
      }
    );
  },

  /** Unblock a profile (idempotent) */
  async unblock(blockedId) {
    if (!blockedId) throw new Error('blocks.unblock: blockedId required');

    const userId = await getAuthUserId();
    if (!userId) throw new Error('blocks.unblock: auth required');

    const [blockerActorId, blockedActorId] = await Promise.all([
      getMyActorId(userId),
      getActorIdByProfileId(blockedId),
    ]);
    if (!blockerActorId || !blockedActorId) return true;

    const { error } = await vc
      .from('user_blocks')
      .delete()
      .match({ blocker_actor_id: blockerActorId, blocked_actor_id: blockedActorId });

    if (error) throw error;
    return true;
  },

  /** Is current user blocking this profile? (one-way) */
  async isBlocked(blockedId) {
    if (!blockedId) return false;

    const userId = await getAuthUserId();
    if (!userId) return false;

    const [blockerActorId, blockedActorId] = await Promise.all([
      getMyActorId(userId),
      getActorIdByProfileId(blockedId),
    ]);
    if (!blockerActorId || !blockedActorId) return false;

    const { data, error } = await vc
      .from('user_blocks')
      .select('blocker_actor_id')
      .match({ blocker_actor_id: blockerActorId, blocked_actor_id: blockedActorId })
      .order('created_at', { ascending: false })
      .limit(1); // array read

    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
  },

  /**
   * List my blocks (profile IDs).
   * Returns [{ blocked_id }] or with created_at if you want to show timestamps.
   */
  async listMyBlocks({ limit = 100, withReasons = false } = {}) {
    const userId = await getAuthUserId();
    if (!userId) return [];

    const blockerActorId = await getMyActorId(userId);
    if (!blockerActorId) return [];

    const { data, error } = await vc
      .from('user_blocks')
      .select('blocked_id, created_at, blocked_actor_id')
      .eq('blocker_actor_id', blockerActorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Back-fill blocked_id from actors if null
    const missingActorIds = (data ?? [])
      .filter(r => !r.blocked_id && r.blocked_actor_id)
      .map(r => r.blocked_actor_id);

    let actorToProfile = {};
    if (missingActorIds.length) {
      const { data: actors, error: aerr } = await vc
        .from('actors')
        .select('id, profile_id')
        .in('id', missingActorIds);
      if (aerr) throw aerr;
      actorToProfile = Object.fromEntries((actors ?? []).map(a => [a.id, a.profile_id]));
    }

    return (data ?? []).map(r => ({
      blocked_id: r.blocked_id ?? actorToProfile[r.blocked_actor_id] ?? null,
      ...(withReasons ? { created_at: r.created_at } : {}),
    }));
  },

  /**
   * NEW: Actor-level block check in either direction.
   * aActorId = viewer actor
   * bActorId = target actor
   */
  async hasBlockEitherDirectionActors(aActorId, bActorId) {
    if (!aActorId || !bActorId) return false;

    const { data, error } = await vc
      .from('user_blocks')
      .select('blocker_actor_id, blocked_actor_id')
      .or(
        `and(blocker_actor_id.eq.${aActorId},blocked_actor_id.eq.${bActorId}),` +
          `and(blocker_actor_id.eq.${bActorId},blocked_actor_id.eq.${aActorId})`
      )
      .limit(1);

    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
  },
};

export default core;
export { core as blocks };
