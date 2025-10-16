// src/data/user/followers.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Is viewer following target?
 * Returns boolean (true if an active follower row exists).
 */
export async function isFollowing(viewerId, targetId) {
  if (!viewerId || !targetId || viewerId === targetId) return false;
  const { data, error } = await supabase
    .schema('vc')
    .from('followers')
    .select('follower_id')
    .eq('follower_id', viewerId)
    .eq('followed_id', targetId)
    .eq('is_active', true)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error; // ignore "no rows" error
  return !!data;
}

/**
 * Follow: create or re-activate the follower row.
 * For public profiles or already-accepted requests.
 * Uses upsert to handle both new + previously-unfollowed cases.
 *
 * NOTE: For private profiles, you should call `createFollowRequest` instead.
 */
export async function follow(viewerId, targetId) {
  if (!viewerId || !targetId || viewerId === targetId) return false;
  const payload = { follower_id: viewerId, followed_id: targetId, is_active: true };

  const { error } = await supabase
    .schema('vc')
    .from('followers')
    .upsert(payload, { onConflict: 'followed_id,follower_id' });

  if (error) throw error;
  return true;
}

/**
 * Unfollow: either delete row or set is_active=false.
 * Deleting is fine (RLS allows deleting your own rows).
 */
export async function unfollow(viewerId, targetId) {
  if (!viewerId || !targetId || viewerId === targetId) return false;

  const { error } = await supabase
    .schema('vc')
    .from('followers')
    .delete()
    .match({ follower_id: viewerId, followed_id: targetId });

  if (error) throw error;
  return true;
}

/** Optional: count active followers of a profile */
export async function countFollowers(targetId) {
  if (!targetId) return 0;
  const { count, error } = await supabase
    .schema('vc')
    .from('followers')
    .select('followed_id', { count: 'exact', head: true })
    .eq('followed_id', targetId)
    .eq('is_active', true);
  if (error) throw error;
  return count ?? 0;
}

/** Check if there's a pending follow request (for private profiles) */
export async function hasPendingFollowRequest(viewerId, targetId) {
  if (!viewerId || !targetId || viewerId === targetId) return false;
  const { data, error } = await supabase
    .schema('vc')
    .from('follow_requests')
    .select('id')
    .eq('requester_id', viewerId)
    .eq('target_id', targetId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/** Create a follow request (for private profiles) */
export async function createFollowRequest(viewerId, targetId) {
  if (!viewerId || !targetId || viewerId === targetId) return false;
  const { data, error } = await supabase
    .schema('vc')
    .from('follow_requests')
    .insert({ requester_id: viewerId, target_id: targetId, status: 'pending' })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Cancel a pending follow request */
export async function cancelFollowRequest(viewerId, targetId) {
  if (!viewerId || !targetId || viewerId === targetId) return false;
  const { error } = await supabase
    .schema('vc')
    .from('follow_requests')
    .delete()
    .match({ requester_id: viewerId, target_id: targetId, status: 'pending' });

  if (error) throw error;
  return true;
}
