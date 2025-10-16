// src/utils/socialfriends/social.js
import { supabase } from '@/lib/supabaseClient';

/** RPC helper: also detect "missing function" cleanly */
async function callRpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  const msg = (error && (error.message || error.details || '')) || '';
  const code = (error && error.code) || '';
  const missing =
    !!error &&
    (
      /function.*not.*found/i.test(msg) ||
      /unknown function/i.test(msg) ||
      /does not exist/i.test(msg) ||
      /stored procedure/i.test(msg) ||
      /^PGRST20\d$/i.test(code) ||
      code === '404'
    );
  return { data, error, missing };
}

// 👉 Route to vc schema
const vc = supabase.schema('vc');

/* ===========================
 * FOLLOW / UNFOLLOW
 * =========================== */

/** True if the current user follows otherUserId (only active follows). */
export async function isFollowing(otherUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !otherUserId || me === otherUserId) return false;

  const res = await vc
    .from('followers')
    .select('follower_id', { count: 'exact', head: true })
    .eq('follower_id', me)
    .eq('followed_id', otherUserId)
    .eq('is_active', true);

  if (res.error) throw res.error;
  return (res.count ?? 0) > 0;
}

/** Follow target user (idempotent). */
export async function followUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !targetUserId || me === targetUserId) return false;

  // If already following, exit early
  try {
    if (await isFollowing(targetUserId)) return true;
  } catch {
    // ignore read errors, still attempt write
  }

  // Try RPC first (if you have one)
  {
    const r = await callRpc('follow_user', { target: targetUserId });
    if (!r.error) return r.data === true || (await safeIsFollowing(targetUserId));
    if (!r.missing) throw r.error;
  }

  // Fallback: upsert in vc.followers
  const { error } = await vc
    .from('followers')
    .upsert(
      {
        follower_id: me,
        followed_id: targetUserId,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      // 👈 must match your PK order (followed_id, follower_id)
      { onConflict: 'followed_id,follower_id' }
    );

  if (error) throw error;
  return await safeIsFollowing(targetUserId);
}

/** Unfollow (soft-deactivate the row). */
export async function unfollowUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !targetUserId) return false;

  // Try RPC first
  {
    const r = await callRpc('unfollow_user', { target: targetUserId });
    if (!r.error) return !(await safeIsFollowing(targetUserId));
    if (!r.missing) throw r.error;
  }

  // Fallback: mark inactive
  const upd = await vc
    .from('followers')
    .update({ is_active: false, created_at: new Date().toISOString() })
    .eq('follower_id', me)
    .eq('followed_id', targetUserId);

  if (upd.error) throw upd.error;
  return !(await safeIsFollowing(targetUserId));
}

/** Same as isFollowing but swallows read errors and returns false on failure. */
async function safeIsFollowing(otherUserId) {
  try { return await isFollowing(otherUserId); }
  catch { return false; }
}

/** Follower + following counts (active only). */
export async function followerCounts(userId) {
  if (!userId) return { followers: 0, following: 0 };
  const [followers, following] = await Promise.all([
    vc.from('followers')
      .select('followed_id', { count: 'exact', head: true })
      .eq('followed_id', userId)
      .eq('is_active', true),
    vc.from('followers')
      .select('follower_id', { count: 'exact', head: true })
      .eq('follower_id', userId)
      .eq('is_active', true),
  ]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

/* ===========================
 * FRIEND REQUESTS (same as before)
 * =========================== */

export async function isBlockedEither(otherUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !otherUserId || me === otherUserId) return false;

  // Prefer RPC if present
  try {
    const { data, error } = await supabase.rpc('blocked_either', { p_a: me, p_b: otherUserId });
    if (!error) return !!data;
  } catch {}

  // Fallback: vc.user_blocks both directions
  const res = await vc
    .from('user_blocks')
    .select('blocker_id', { count: 'exact', head: true })
    .or(
      `and(blocker_id.eq.${me},blocked_id.eq.${otherUserId}),` +
      `and(blocker_id.eq.${otherUserId},blocked_id.eq.${me})`
    );
  if (res.error) return false;
  return (res.count ?? 0) > 0;
}

export async function sendFriendRequest(targetUserId, message = null) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || me === targetUserId) return null;

  try {
    if (await isBlockedEither(targetUserId)) {
      throw new Error('You can’t send a request because one of you has blocked the other.');
    }
  } catch (e) {
    if (e?.message?.includes('blocked')) throw e;
  }

  // Try RPC
  {
    const r = await callRpc('send_friend_request', { target: targetUserId, msg: message });
    if (!r.error) return r.data;
    if (!r.missing) throw r.error;
  }

  // Fallback to public.friend_requests (per your schema)
  const { data: existing, error: qErr } = await supabase
    .from('friend_requests')
    .select('id, status')
    .or(
      `and(requester_id.eq.${me},addressee_id.eq.${targetUserId}),` +
      `and(requester_id.eq.${targetUserId},addressee_id.eq.${me})`
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

/* ===========================
 * BLOCK / UNBLOCK
 * =========================== */

export async function isBlocked(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !targetUserId || me === targetUserId) return false;

  const res = await vc
    .from('user_blocks')
    .select('blocked_id', { count: 'exact', head: true })
    .eq('blocker_id', me)
    .eq('blocked_id', targetUserId);

  if (res.error) throw res.error;
  return (res.count ?? 0) > 0;
}

export async function blockUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !targetUserId || me === targetUserId) return false;

  const { error } = await vc
    .from('user_blocks')
    .upsert({ blocker_id: me, blocked_id: targetUserId }, { onConflict: 'blocker_id,blocked_id' });

  if (error) throw error;
  return true;
}

export async function unblockUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !targetUserId) return false;

  const { error } = await vc
    .from('user_blocks')
    .delete()
    .eq('blocker_id', me)
    .eq('blocked_id', targetUserId);

  if (error) throw error;
  return true;
}
