// src/utils/socialfriends/social.js
import { supabase } from '@/lib/supabaseClient';

/* ========= shared ========= */
async function callRpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  const code = error?.code || '';
  const msg = error?.message || error?.details || '';
  const missing =
    !!error &&
    (/function.*not.*found/i.test(msg) ||
      /unknown function/i.test(msg) ||
      /does not exist/i.test(msg) ||
      /stored procedure/i.test(msg) ||
      /^PGRST20\d$/i.test(code) ||
      code === '404');
  return { data, error, missing };
}

const vc = supabase.schema('vc');

/* ========= actor helpers (NEW) ========= */

/** Resolve vc.actors.id for a given auth user id (profiles.id). */
async function getActorIdForUser(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  // PGRST116 = No rows found for maybeSingle; treat as null without throwing.
  if (error && error.code !== 'PGRST116') throw error;
  return data?.id ?? null;
}

/* ========= FOLLOW / UNFOLLOW (actor-aware) ========= */

/**
 * Check if the CURRENT user follows another user (by auth user id),
 * using the actor graph (vc.actor_follows).
 */
export async function isFollowing(otherUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const meUserId = auth?.user?.id;
  if (!meUserId || !otherUserId || meUserId === otherUserId) return false;

  const [meActorId, otherActorId] = await Promise.all([
    getActorIdForUser(meUserId),
    getActorIdForUser(otherUserId),
  ]);
  if (!meActorId || !otherActorId || meActorId === otherActorId) return false;

  const { count, error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .select('follower_actor_id', { head: true, count: 'exact' })
    .eq('follower_actor_id', meActorId)
    .eq('followed_actor_id', otherActorId)
    .eq('is_active', true);

  if (error) throw error;
  return (count ?? 0) > 0;
}

async function safeIsFollowing(otherUserId) {
  try { return await isFollowing(otherUserId); }
  catch { return false; }
}

/**
 * Follow a target user (by auth user id) via vc.actor_follows.
 * Keeps your legacy RPC path as a first try if present.
 */
export async function followUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const meUserId = auth?.user?.id;
  if (!meUserId || !targetUserId || meUserId === targetUserId) return false;

  // Legacy RPC (optional)
  {
    const r = await callRpc('follow_user', { target: targetUserId });
    if (!r.error) return r.data === true || (await safeIsFollowing(targetUserId));
    if (!r.missing) throw r.error;
  }

  const [meActorId, targetActorId] = await Promise.all([
    getActorIdForUser(meUserId),
    getActorIdForUser(targetUserId),
  ]);
  if (!meActorId || !targetActorId || meActorId === targetActorId) return false;

  const { error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .upsert(
      {
        follower_actor_id: meActorId,
        followed_actor_id: targetActorId,
        is_active: true,
      },
      { onConflict: 'follower_actor_id,followed_actor_id' }
    );

  if (error) throw error;
  return true;
}

/**
 * Unfollow a target user (by auth user id) via vc.actor_follows.
 * Keeps your legacy RPC path as a first try if present.
 */
export async function unfollowUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const meUserId = auth?.user?.id;
  if (!meUserId || !targetUserId) return false;

  // Legacy RPC (optional)
  {
    const r = await callRpc('unfollow_user', { target: targetUserId });
    if (!r.error) return !(await safeIsFollowing(targetUserId));
    if (!r.missing) throw r.error;
  }

  const [meActorId, targetActorId] = await Promise.all([
    getActorIdForUser(meUserId),
    getActorIdForUser(targetUserId),
  ]);
  if (!meActorId || !targetActorId || meActorId === targetActorId) return false;

  const { error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .delete()
    .match({ follower_actor_id: meActorId, followed_actor_id: targetActorId });

  if (error) throw error;
  return true;
}

/**
 * Count followers/following for a given auth user id
 * by first resolving their actor id.
 */
export async function followerCounts(userId) {
  if (!userId) return { followers: 0, following: 0 };
  const actorId = await getActorIdForUser(userId);
  if (!actorId) return { followers: 0, following: 0 };

  const [followers, following] = await Promise.all([
    supabase
      .schema('vc')
      .from('actor_follows')
      .select('followed_actor_id', { count: 'exact', head: true })
      .eq('followed_actor_id', actorId)
      .eq('is_active', true),
    supabase
      .schema('vc')
      .from('actor_follows')
      .select('follower_actor_id', { count: 'exact', head: true })
      .eq('follower_actor_id', actorId)
      .eq('is_active', true),
  ]);

  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

/* ========= BLOCKS ========= */

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

export async function isBlockedEither(otherUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || !otherUserId || me === otherUserId) return false;

  try {
    const { data, error } = await supabase.rpc('blocked_either', { p_a: me, p_b: otherUserId });
    if (!error) return !!data;
  } catch {}

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

/* ========= FRIEND REQUESTS (vc.social_follow_requests) ========= */

function compositeId(r) {
  return `${r.requester_id}:${r.target_id}`;
}
function parseCompositeId(id) {
  const i = id.indexOf(':');
  if (i === -1) return null;
  return { requester_id: id.slice(0, i), target_id: id.slice(i + 1) };
}

/** List (I am requester OR target). Alias target_id -> addressee_id; add synthetic id. */
export async function listMyFriendRequests() {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return [];

  const { data, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .select('requester_id,target_id,status,created_at,updated_at,message')
    .or(`requester_id.eq.${me},target_id.eq.${me}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(r => ({
    ...r,
    id: compositeId(r),
    addressee_id: r.target_id,
  }));
}

/** Send/re-send request. Always reset to 'pending' on conflict so Accept/Decline shows again. */
export async function sendFriendRequest(targetUserId, message = null) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || me === targetUserId) return null;

  // Optional: block guard
  try {
    if (await isBlockedEither(targetUserId)) {
      throw new Error('You can’t send a request because one of you has blocked the other.');
    }
  } catch (e) {
    if (e?.message?.includes('blocked')) throw e;
  }

  // RPC first
  {
    const r = await callRpc('send_friend_request', { target: targetUserId, msg: message });
    if (!r.error) return r.data ?? compositeId({ requester_id: me, target_id: targetUserId });
    if (!r.missing) throw r.error;
  }

  // Direct write
  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .upsert(
      {
        requester_id: me,
        target_id: targetUserId, // must be auth.users.id
        status: 'pending',
        message: message ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'requester_id,target_id', ignoreDuplicates: false }
    );
  if (error) throw error;

  return compositeId({ requester_id: me, target_id: targetUserId });
}

/** Target user accepts/declines using synthetic id "requester:target". */
export async function respondFriendRequest(requestId, action) {
  // RPC first (keeps legacy path working if present)
  {
    const r = await callRpc('respond_friend_request', { request_id: requestId, action });
    if (!r.error && r.data != null) return !!r.data;
    if (!r.missing && r.error) throw r.error;
  }

  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return false;

  const ids = parseCompositeId(requestId);
  if (!ids) throw new Error('Invalid request id');

  const nowIso = new Date().toISOString();
  const nextStatus =
    action === 'accept' ? 'accepted' :
    action === 'decline' ? 'declined' : null;
  if (!nextStatus) return false;

  // ✅ IMPORTANT: match on USER ids and assert I am the TARGET (target_id = me).
  // The old code compared me (user id) to target_actor_id (actor id) → 0 rows.
  const { data: updated, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({ status: nextStatus, updated_at: nowIso })
    .match({
      requester_id: ids.requester_id,
      target_id: ids.target_id,
      status: 'pending',
    })
    .eq('target_id', me) // assert I’m the target
    .select('requester_id'); // return rows to detect no-op

  if (error) throw error;
  if (!Array.isArray(updated) || updated.length === 0) {
    throw new Error('No pending request matched (are you the target?)');
  }

  return true;
}

/** Requester cancels their pending request. */
export async function cancelFriendRequest(targetUserId) {
  // RPC first
  {
    const r = await callRpc('cancel_friend_request', { target: targetUserId });
    if (!r.error && r.data != null) return !!r.data;
    if (!r.missing && r.error) throw r.error;
  }

  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return false;

  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .match({ requester_id: me, target_id: targetUserId })
    .eq('status', 'pending');

  if (error) throw error;
  return true;
}
