// src/utils/social.js
import { supabase } from '@/lib/supabaseClient';

/** RPC helper: also detect "missing function" cleanly */
async function callRpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  const msg = (error && error.message) || '';
  const missing =
    !!error &&
    (/function.*not.*found/i.test(msg) ||
      /does not exist/i.test(msg) ||
      /unknown function/i.test(msg));
  return { data, error, missing };
}

/* ===========================
 * FOLLOW / UNFOLLOW
 * =========================== */

/**
 * True if the current user follows otherUserId.
 * Uses head:true + count probe (no row body, cheap & safe).
 */
export async function isFollowing(otherUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !otherUserId || me === otherUserId) return false;

  const res = await supabase
    .from('followers')
    .select('follower_id', { count: 'exact', head: true }) // safe: follower_id exists
    .eq('follower_id', me)
    .eq('followed_id', otherUserId);

  if (res.error) {
    // Often caused by RLS denying SELECT. Surface a helpful message for dev builds.
    if (import.meta.env?.DEV) {
      console.warn('[social.isFollowing] select failed:', res.error);
    }
    throw res.error;
  }
  return (res.count ?? 0) > 0;
}

export async function followUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !targetUserId || me === targetUserId) return false;

  // If already following, exit early
  try {
    if (await isFollowing(targetUserId)) return true;
  } catch (e) {
    // If RLS blocks the read, we can still attempt via RPC/insert and verify later.
    if (import.meta.env?.DEV) console.warn('[social.followUser] isFollowing read failed, continuing:', e?.message);
  }

  // Try RPC first
  {
    const r = await callRpc('follow_user', { target: targetUserId });
    if (!r.error) return r.data === true || (await safeIsFollowing(targetUserId));
    if (!r.missing) throw r.error;
  }

  // Fallback: insert composite row
  const ins = await supabase
    .from('followers')
    .insert({ follower_id: me, followed_id: targetUserId });
  // If unique constraint exists, a duplicate is a no-op
  if (ins.error && ins.error.code !== '23505') throw ins.error;

  return await safeIsFollowing(targetUserId);
}

export async function unfollowUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !targetUserId || me === targetUserId) return false;

  // Try RPC first
  {
    const r = await callRpc('unfollow_user', { target: targetUserId });
    if (!r.error) return !(await safeIsFollowing(targetUserId));
    if (!r.missing) throw r.error;
  }

  // Fallback: delete composite row
  const del = await supabase
    .from('followers')
    .delete()
    .eq('follower_id', me)
    .eq('followed_id', targetUserId);

  if (del.error) throw del.error;
  return !(await safeIsFollowing(targetUserId));
}

/** Same as isFollowing but swallows read errors and returns false on failure. */
async function safeIsFollowing(otherUserId) {
  try {
    return await isFollowing(otherUserId);
  } catch {
    return false;
  }
}

export async function followerCounts(userId) {
  if (!userId) return { followers: 0, following: 0 };
  const [followers, following] = await Promise.all([
    supabase
      .from('followers')
      .select('followed_id', { count: 'exact', head: true })
      .eq('followed_id', userId),
    supabase
      .from('followers')
      .select('follower_id', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

/* ===========================
 * FRIEND REQUESTS
 * =========================== */

export async function sendFriendRequest(targetUserId, message = null) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || me === targetUserId) return null;

  // RPC first
  {
    const r = await callRpc('send_friend_request', { target: targetUserId, msg: message });
    if (!r.error) return r.data;
    if (!r.missing) throw r.error;
  }

  // Fallback
  const { data: existing, error: qErr } = await supabase
    .from('friend_requests')
    .select('id, status')
    .or(
      `and(requester_id.eq.${me},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${me})`
    )
    .limit(1);
  if (qErr) throw qErr;
  if (existing?.length) return existing[0].status === 'pending' ? existing[0].id : null;

  const { data: ins, error: iErr } = await supabase
    .from('friend_requests')
    .insert({ requester_id: me, addressee_id: targetUserId, status: 'pending', message })
    .select('id')
    .single();
  if (iErr) throw iErr;
  return ins?.id ?? null;
}

export async function respondFriendRequest(requestId, action) {
  {
    const r = await callRpc('respond_friend_request', { request_id: requestId, action });
    if (!r.error) return r.data === true;
    if (!r.missing) throw r.error;
  }

  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return false;

  if (action === 'decline') {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('addressee_id', me)
      .eq('status', 'pending');
    if (error) throw error;
    return true;
  }

  if (action === 'accept') {
    const { data: fr, error: upErr } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('addressee_id', me)
      .eq('status', 'pending')
      .select('requester_id, addressee_id')
      .single();
    if (upErr) throw upErr;
    if (!fr) return true;

    const a = fr.requester_id < fr.addressee_id ? fr.requester_id : fr.addressee_id;
    const b = fr.requester_id < fr.addressee_id ? fr.addressee_id : fr.requester_id;

    const { error: fErr } = await supabase
      .from('friends')
      .insert({ user_a: a, user_b: b })
      .select()
      .single();
    if (fErr && !/duplicate|unique/i.test(fErr.message || '')) throw fErr;

    return true;
  }

  return false;
}

export async function cancelFriendRequest(targetUserId) {
  {
    const r = await callRpc('cancel_friend_request', { target: targetUserId });
    if (!r.error) return r.data === true;
    if (!r.missing) throw r.error;
  }

  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return false;

  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'canceled', responded_at: new Date().toISOString() })
    .eq('requester_id', me)
    .eq('addressee_id', targetUserId)
    .eq('status', 'pending');
  if (error) throw error;
  return true;
}

export async function unfriend(targetUserId) {
  {
    const r = await callRpc('unfriend', { target: targetUserId });
    if (!r.error) return r.data === true;
    if (!r.missing) throw r.error;
  }

  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || me === targetUserId) return false;

  const a = me < targetUserId ? me : targetUserId;
  const b = me < targetUserId ? targetUserId : me;

  const { error } = await supabase.from('friends').delete().match({ user_a: a, user_b: b });
  if (error) throw error;
  return true;
}

/** Friend-requests involving me (for inbox UIs) */
export async function listMyFriendRequests() {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return [];
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, requester_id, addressee_id, status, message, created_at, responded_at')
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
