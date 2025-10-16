// /src/features/profiles/lib/friendrequest/followRequests.js
import { supabase } from '@/lib/supabaseClient';

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers: auth.user.id → profiles.id → actors.id
 *────────────────────────────────────────────────────────────────────────── */

async function getMyAuthUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data?.user || null;
  if (!user?.id) throw new Error('Not authenticated');
  return user;
}

/** Returns public.profiles.id for a given auth.users.id (often the same id in many apps). */
async function getProfileIdForAuthUser(authUserId) {
  // If your profiles.id == auth.users.id, you can return authUserId directly.
  // We resolve via DB in case they ever diverge.
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authUserId) // adjust if you store the mapping differently
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error('Profile not found for user');
  return data.id;
}

/** Returns vc.actors.id for a given profile_id (for kind='user' actor). */
async function getActorIdForProfile(profileId) {
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', profileId)
    .eq('kind', 'user') // adjust if you want vport/org, etc.
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error('Actor not found for profile');
  return data.id;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Requester-side: status / create / cancel
 *────────────────────────────────────────────────────────────────────────── */

export async function getFollowRequestStatus({ requesterId, targetId }) {
  // requesterId & targetId here are auth.users.id
  const { data, error } = await supabase
    .schema('vc')
    .from('follow_requests')
    .select('status')
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.status || null; // null = no request yet
}

export async function createFollowRequest({ targetId }) {
  // targetId is expected to be auth.users.id (owner’s auth id)
  const meAuth = await getMyAuthUser(); // requester auth
  const myProfileId = await getProfileIdForAuthUser(meAuth.id);  // for notifications actor lookup + other tables
  const myActorId = await getActorIdForProfile(myProfileId);

  // 1) insert follow_requests (auth-domain IDs)
  const { error } = await supabase
    .schema('vc')
    .from('follow_requests')
    .insert({
      requester_id: meAuth.id,
      target_id: targetId,
      status: 'pending',
    });

  if (error) throw error;

  // 2) emit notification to target’s notifications inbox
  //    vc.notifications requires: user_id (recipient profile id), actor_id (vc.actors.id), kind, context
  try {
    const targetProfileId = await getProfileIdForAuthUser(targetId);

    // tiny requester card for UI
    const { data: meProf } = await supabase
      .from('profiles')
      .select('id, username, display_name, photo_url')
      .eq('id', myProfileId)
      .maybeSingle();

    await supabase
      .schema('vc')
      .from('notifications')
      .insert({
        user_id: targetProfileId,        // recipient (profile id)
        actor_id: myActorId,             // requester actor id
        kind: 'follow_request',
        object_type: 'follow_request',
        object_id: null,
        link_path: null,                 // e.g., `/u/<username>` if you want a deep link
        context: {
          requester: meProf || { id: myProfileId },
          requester_auth_id: meAuth.id,
        },
        is_seen: false,
        is_read: false,
      });
  } catch (e) {
    // don't block request creation on notification failure
    console.warn('[followRequests] notification insert failed', e?.message || e);
  }

  return true;
}

export async function cancelFollowRequest({ targetId }) {
  const meAuth = await getMyAuthUser();

  const { error } = await supabase
    .schema('vc')
    .from('follow_requests')
    .update({ status: 'cancelled' })
    .eq('requester_id', meAuth.id)
    .eq('target_id', targetId)
    .eq('status', 'pending');

  if (error) throw error;
  return true;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Target-side: list pending / accept / decline
 * IMPORTANT: followers table wants profiles.id (NOT auth.users.id)
 *────────────────────────────────────────────────────────────────────────── */

// REPLACE ONLY this function in /src/features/profiles/lib/friendrequest/followRequests.js

export async function listIncomingFollowRequests() {
  const { data: authRes, error: uerr } = await supabase.auth.getUser();
  if (uerr) throw uerr;
  const meAuthId = authRes?.user?.id;
  if (!meAuthId) throw new Error('Not authenticated');

  // 1) Raw pending requests (AUTH-domain ids)
  const { data: reqs, error } = await supabase
    .schema('vc')
    .from('follow_requests')
    .select('requester_id, target_id, status, created_at')
    .eq('target_id', meAuthId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;

  if (!reqs?.length) return [];

  // 2) Fetch requester profiles in one round-trip (PROFILE-domain ids == auth ids in your app)
  const ids = [...new Set(reqs.map(r => r.requester_id))];
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, photo_url')
    .in('id', ids);
  if (pErr) throw pErr;

  const byId = new Map((profiles || []).map(p => [p.id, p]));

  // 3) Merge into the shape your UI expects
  return reqs.map(r => ({
    requesterAuthId: r.requester_id,                 // AUTH id (also your profiles.id)
    targetAuthId: r.target_id,                       // AUTH id
    status: r.status,
    createdAt: r.created_at,
    requesterProfile: byId.get(r.requester_id) || null, // PROFILE row for tile UI
  }));
}


/**
 * Accept a request:
 *  1) upsert follower (requesterProfileId → myProfileId) in vc.followers
 *  2) mark follow_requests row as accepted (auth domain)
 *  3) (optional) notify requester that it was accepted
 */
export async function acceptFollowRequest({ requesterId }) {
  // requesterId is AUTH user id of the requester
  const meAuth = await getMyAuthUser();
  const myProfileId = await getProfileIdForAuthUser(meAuth.id);
  const requesterProfileId = await getProfileIdForAuthUser(requesterId); // convert AUTH → PROFILE for followers table

  // 1) Upsert followers with PROFILE ids
  const { error: fErr } = await supabase
    .schema('vc')
    .from('followers')
    .upsert(
      { follower_id: requesterProfileId, followed_id: myProfileId, is_active: true },
      { onConflict: 'followed_id,follower_id' }
    );
  if (fErr) throw fErr;

  // 2) Mark request accepted (AUTH ids)
  const { error: rErr } = await supabase
    .schema('vc')
    .from('follow_requests')
    .update({ status: 'accepted' })
    .match({ requester_id: requesterId, target_id: meAuth.id, status: 'pending' });
  if (rErr) throw rErr;

  // 3) Optional: send a notification to the requester that it was accepted
  try {
    const myActorId = await getActorIdForProfile(myProfileId);
    await supabase
      .schema('vc')
      .from('notifications')
      .insert({
        user_id: requesterProfileId,   // recipient is requester (profile id)
        actor_id: myActorId,           // actor is me (target who accepted)
        kind: 'follow_request_accepted',
        object_type: 'follow',
        object_id: null,
        link_path: null,
        context: { target_profile_id: myProfileId, target_auth_id: meAuth.id },
        is_seen: false,
        is_read: false,
      });
  } catch (e) {
    console.warn('[followRequests] accept notify failed', e?.message || e);
  }

  return true;
}

/**
 * Decline a request (target side)
 */
export async function declineFollowRequest({ requesterId }) {
  const meAuth = await getMyAuthUser();

  const { error } = await supabase
    .schema('vc')
    .from('follow_requests')
    .update({ status: 'declined' })
    .match({ requester_id: requesterId, target_id: meAuth.id, status: 'pending' });

  if (error) throw error;

  // Optional: notify requester of the decline (comment out if not desired)
  try {
    const myProfileId = await getProfileIdForAuthUser(meAuth.id);
    const myActorId = await getActorIdForProfile(myProfileId);
    const requesterProfileId = await getProfileIdForAuthUser(requesterId);
    await supabase
      .schema('vc')
      .from('notifications')
      .insert({
        user_id: requesterProfileId,
        actor_id: myActorId,
        kind: 'follow_request_declined',
        object_type: 'follow',
        object_id: null,
        link_path: null,
        context: { target_profile_id: myProfileId, target_auth_id: meAuth.id },
        is_seen: false,
        is_read: false,
      });
  } catch (e) {
    console.warn('[followRequests] decline notify failed', e?.message || e);
  }

  return true;
}

/* Convenience wrapper */
export async function respondToFollowRequest({ requesterId, accept }) {
  if (accept) return acceptFollowRequest({ requesterId });
  return declineFollowRequest({ requesterId });
}
