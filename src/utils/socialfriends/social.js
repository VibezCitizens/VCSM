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

/* ========= actor helpers ========= */

/** Resolve vc.actors.id for a given auth user id (profiles.id). */
async function getActorIdForUser(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.id ?? null;
}

/* ========= FOLLOW / UNFOLLOW (actor-aware) ========= */

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
  try {
    return await isFollowing(otherUserId);
  } catch {
    return false;
  }
}

export async function followUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const meUserId = auth?.user?.id;
  if (!meUserId || !targetUserId || meUserId === targetUserId) return false;

  // Legacy RPC support
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

export async function unfollowUser(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const meUserId = auth?.user?.id;
  if (!meUserId || !targetUserId) return false;

  // Legacy RPC support
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
    .match({
      follower_actor_id: meActorId,
      followed_actor_id: targetActorId,
    });

  if (error) throw error;
  return true;
}

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

  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

/* ========= FRIEND REQUESTS ========= */

function compositeId(r) {
  return `${r.requester_id}:${r.target_id}`;
}

function parseCompositeId(id) {
  const i = id.indexOf(':');
  if (i === -1) return null;
  return { requester_id: id.slice(0, i), target_id: id.slice(i + 1) };
}

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

  return (data ?? []).map((r) => ({
    ...r,
    id: compositeId(r),
    addressee_id: r.target_id,
  }));
}

export async function sendFriendRequest(targetUserId, message = null) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me || me === targetUserId) return null;

  // RPC first
  {
    const r = await callRpc('send_friend_request', {
      target: targetUserId,
      msg: message,
    });
    if (!r.error) return r.data ?? compositeId({ requester_id: me, target_id: targetUserId });
    if (!r.missing) throw r.error;
  }

  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .upsert(
      {
        requester_id: me,
        target_id: targetUserId,
        status: 'pending',
        message: message ?? null,
        created_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'requester_id,target_id', ignoreDuplicates: false }
    );

  if (error) throw error;

  return compositeId({ requester_id: me, target_id: targetUserId });
}

export async function respondFriendRequest(requestId, action) {
  const ids = parseCompositeId(requestId);
  if (!ids) throw new Error('Invalid request id');

  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return false;

  {
    const r = await callRpc('respond_friend_request', {
      request_id: requestId,
      action,
    });
    if (!r.error && r.data != null) return !!r.data;
    if (!r.missing && r.error) throw r.error;
  }

  const nextStatus =
    action === 'accept'
      ? 'accepted'
      : action === 'decline'
      ? 'declined'
      : null;

  if (!nextStatus) return false;

  const nowIso = new Date().toISOString();

  const { data: updated, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({ status: nextStatus, updated_at: nowIso })
    .match({
      requester_id: ids.requester_id,
      target_id: ids.target_id,
      status: 'pending',
    })
    .eq('target_id', me)
    .select('requester_id');

  if (error) throw error;

  if (!Array.isArray(updated) || updated.length === 0) {
    throw new Error('No pending request matched');
  }

  return true;
}

export async function cancelFriendRequest(targetUserId) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return false;

  {
    const r = await callRpc('cancel_friend_request', {
      target: targetUserId,
    });
    if (!r.error && r.data != null) return !!r.data;
    if (!r.missing && r.error) throw r.error;
  }

  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .match({ requester_id: me, target_id: targetUserId })
    .eq('status', 'pending');

  if (error) throw error;
  return true;
}
