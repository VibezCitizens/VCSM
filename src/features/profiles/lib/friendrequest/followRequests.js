// src/features/profiles/lib/friendrequest/followRequests.js
// (instrumented for debugging only — no behavior changes)

import { supabase } from '@/lib/supabaseClient';

const DBG = true;
const dlog = (...a) => DBG && console.debug('[followRequests]', ...a);

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

async function requireAuthUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data?.user;
  if (!user?.id) throw new Error('Not authenticated');
  dlog('requireAuthUser →', user.id);
  return user;
}

/** The “user-actor” for a given auth user (actors.profile_id = auth user id) */
async function getUserActorIdForUser(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', userId)
    .limit(1);
  if (error) throw error;
  const out = Array.isArray(data) && data[0]?.id ? data[0].id : null;
  dlog('getUserActorIdForUser →', { userId, actorId: out });
  return out;
}

/** Any owner of an actor (covers user actors and vports) */
async function getOwnerUserIdForActor(actorId) {
  if (!actorId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actor_owners')
    .select('user_id')
    .eq('actor_id', actorId)
    .limit(1);
  if (error) throw error;
  const out = Array.isArray(data) && data[0]?.user_id ? data[0].user_id : null;
  dlog('getOwnerUserIdForActor →', { actorId, ownerUserId: out });
  return out;
}

/* ------------------------------------------------------------------ *
 * queries
 * ------------------------------------------------------------------ */

/** Read current follow-request status (by actor pair), or null if none */
export async function getFollowRequestStatus({ requesterActorId, targetActorId }) {
  if (!requesterActorId || !targetActorId) return null;

  dlog('getFollowRequestStatus: query', { requesterActorId, targetActorId });
  const { data, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .select('status')
    .eq('requester_actor_id', requesterActorId)
    .eq('target_actor_id', targetActorId)
    .limit(1);

  if (error) throw error;
  const out = Array.isArray(data) && data[0]?.status ? data[0].status : null;
  dlog('getFollowRequestStatus: result', out);
  return out;
}

/**
 * Create (or revive) a follow request to 'pending'.
 * Inputs are ACTOR IDs. We also populate user FKs for your existing PK (requester_id,target_id).
 */
export async function createFollowRequest({ requesterActorId, targetActorId }) {
  if (!requesterActorId || !targetActorId) throw new Error('Missing actor ids');

  dlog('createFollowRequest: begin', { requesterActorId, targetActorId });

  // Resolve user owners for both actors (kept to satisfy your current PK/joins)
  const [requesterUserId, targetUserId] = await Promise.all([
    getOwnerUserIdForActor(requesterActorId),
    getOwnerUserIdForActor(targetActorId),
  ]);

  if (!requesterUserId || !targetUserId) {
    throw new Error('Could not resolve requester/target user owners for the given actors.');
  }

  const payload = {
    requester_id: requesterUserId,
    target_id:    targetUserId,
    requester_actor_id: requesterActorId,
    target_actor_id:    targetActorId,
    status: 'pending',
    updated_at: new Date().toISOString(),
  };
  dlog('createFollowRequest: upsert payload', payload);

  const { data, error: upErr } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .upsert(payload, { onConflict: 'requester_id,target_id' })
    .select('requester_id,target_id,requester_actor_id,target_actor_id,status,created_at,updated_at');

  dlog('createFollowRequest: upsert result', { data, upErr });
  if (upErr) throw upErr;

  // Return current status by actor pair
  const status = await getFollowRequestStatus({ requesterActorId, targetActorId });
  dlog('createFollowRequest: final status', status ?? 'pending');
  return status ?? 'pending';
}

/** Cancel my pending request (by actor pair) */
export async function cancelFollowRequest({ requesterActorId, targetActorId }) {
  if (!requesterActorId || !targetActorId) return true;

  dlog('cancelFollowRequest: begin', { requesterActorId, targetActorId });

  const { data, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .match({
      requester_actor_id: requesterActorId,
      target_actor_id: targetActorId,
      status: 'pending',
    })
    .select('requester_actor_id,target_actor_id,status');

  dlog('cancelFollowRequest: update result', { data, error });
  if (error) throw error;
  return true;
}

/**
 * List incoming pending requests for the CURRENT AUTH USER across:
 *  - rows where target_actor_id == my user-actor
 *  - rows where target_id == my auth user id (legacy support)
 */
export async function listIncomingFollowRequests() {
  const me = await requireAuthUser();
  const myUserActorId = await getUserActorIdForUser(me.id);

  dlog('listIncomingFollowRequests: begin', { me: me.id, myUserActorId });

  // Pull both kinds (actor-targeted and user-targeted)
  const orExpr = [
    myUserActorId ? `and(target_actor_id.eq.${myUserActorId},status.eq.pending)` : null,
    `and(target_id.eq.${me.id},status.eq.pending)`,
  ]
    .filter(Boolean)
    .join(',');

  dlog('listIncomingFollowRequests: or()', orExpr);

  const { data: reqs, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .select('requester_id, requester_actor_id, target_id, target_actor_id, status, created_at')
    .or(orExpr)
    .order('created_at', { ascending: false });

  dlog('listIncomingFollowRequests: rows', reqs);
  if (error) throw error;
  if (!Array.isArray(reqs) || reqs.length === 0) return [];

  // Enrich with requester profile rows (by requester_id = auth/profiles id)
  const requesterUserIds = [...new Set(reqs.map(r => r.requester_id).filter(Boolean))];
  let profilesById = new Map();
  if (requesterUserIds.length) {
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, username, display_name, photo_url')
      .in('id', requesterUserIds);
    if (pErr) throw pErr;
    profilesById = new Map((profiles || []).map(p => [p.id, p]));
  }

  const out = reqs.map(r => ({
    requesterActorId: r.requester_actor_id ?? null,
    targetActorId: r.target_actor_id ?? null,
    status: r.status,
    createdAt: r.created_at,
    requesterProfile: r.requester_id ? profilesById.get(r.requester_id) || null : null,
  }));

  dlog('listIncomingFollowRequests: out →', out);
  return out;
}

/**
 * Accept a pending request (by requesterActorId → my user-actor):
 *  - Upsert actor_follows edge: requesterActorId (follower) → myUserActorId (followed)
 *  - Mark request as 'accepted'
 */
export async function acceptFollowRequest({ requesterActorId }) {
  if (!requesterActorId) throw new Error('Missing requesterActorId');

  const me = await requireAuthUser();
  const myUserActorId = await getUserActorIdForUser(me.id);
  if (!myUserActorId) throw new Error('Your user actor could not be resolved');

  dlog('ACCEPT begin', { me: me.id, requesterActorId, myUserActorId });

  // Sanity: what pending row *should* match? (no 'id' column here)
  {
    const { data: pre, error: preErr } = await supabase
      .schema('vc')
      .from('social_follow_requests')
      .select('requester_id,target_id,requester_actor_id,target_actor_id,status,created_at,updated_at')
      .eq('requester_actor_id', requesterActorId)
      .eq('target_actor_id', myUserActorId)
      .eq('status', 'pending')
      .limit(5);
    dlog('ACCEPT pre-check (expected pending rows):', { rows: pre, error: preErr });
  }

  // 1) Create/activate follow edge in vc.actor_follows
  const followPayload = {
    follower_actor_id: requesterActorId,
    followed_actor_id: myUserActorId,
    is_active: true,
  };
  const { data: fData, error: fErr } = await supabase
    .schema('vc')
    .from('actor_follows')
    .upsert(followPayload, { onConflict: 'follower_actor_id,followed_actor_id' })
    .select('follower_actor_id,followed_actor_id,is_active');

  dlog('ACCEPT actor_follows upsert →', { followPayload, fData, fErr });
  if (fErr) throw fErr;

  // 2) Update the request to accepted (no 'id' column in select)
  const { data: updated, error: rErr } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .match({
      requester_actor_id: requesterActorId,
      target_actor_id: myUserActorId,
      status: 'pending',
    })
    .select('requester_actor_id,target_actor_id,status,updated_at');

  dlog('ACCEPT update →', { updated, rErr });
  if (rErr) throw rErr;
  if (!Array.isArray(updated) || updated.length === 0) {
    throw new Error('No pending request matched this actor pair for the current target.');
  }

  dlog('ACCEPT done ✅');
  return true;
}

/** Decline a pending request (by actor pair) */
export async function declineFollowRequest({ requesterActorId }) {
  if (!requesterActorId) throw new Error('Missing requesterActorId');

  const me = await requireAuthUser();
  const myUserActorId = await getUserActorIdForUser(me.id);
  if (!myUserActorId) throw new Error('Your user actor could not be resolved');

  dlog('DECLINE begin', { me: me.id, requesterActorId, myUserActorId });

  const { data: updated, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .match({
      requester_actor_id: requesterActorId,
      target_actor_id: myUserActorId,
      status: 'pending',
    })
    .select('requester_actor_id,target_actor_id,status,updated_at');

  dlog('DECLINE update →', { updated, error });
  if (error) throw error;
  if (!Array.isArray(updated) || updated.length === 0) {
    throw new Error('No pending request matched this actor pair for the current target.');
  }
  dlog('DECLINE done ✅');
  return true;
}

/** Helper: unified accept/decline (actor-based) */
export async function respondToFollowRequest({ requesterActorId, accept }) {
  dlog('respondToFollowRequest', { requesterActorId, accept });
  return accept
    ? acceptFollowRequest({ requesterActorId })
    : declineFollowRequest({ requesterActorId });
}
