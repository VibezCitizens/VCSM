// src/data/user/notifications.js
// Identity-aware notifications (user or vport inbox) aligned with RLS on recipient_actor_id.
// Block filtering is actor-based (matches vc.user_blocks actor columns).

import { supabase } from '@/lib/supabaseClient';

/** Returns current auth user's profile id (public.profiles.id). In most setups this equals auth.user.id */
async function getCurrentProfileId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id ?? null;
}

/**
 * Resolve the "owner profile" of each actor_id:
 * - if actor is a user-actor: owner = actors.profile_id
 * - if actor is a vport-actor: owner = vports.owner_user_id
 * (Kept for potential UI uses; not required for RLS)
 */
async function resolveActorOwners(actorIds) {
  if (!actorIds?.length) return new Map();

  const { data: actors, error: e1 } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, profile_id, vport_id')
    .in('id', actorIds);
  if (e1) throw e1;

  const map = new Map();
  const vportIds = [...new Set((actors || []).map(a => a.vport_id).filter(Boolean))];

  let vportOwners = [];
  if (vportIds.length) {
    const { data: vps, error: e2 } = await supabase
      .schema('vc')
      .from('vports')
      .select('id, owner_user_id')
      .in('id', vportIds);
    if (e2) throw e2;
    vportOwners = vps || [];
  }
  const vportOwnerMap = new Map(vportOwners.map(v => [v.id, v.owner_user_id]));

  for (const a of actors || []) {
    const owner = a.profile_id ?? (a.vport_id ? vportOwnerMap.get(a.vport_id) : null);
    if (owner) map.set(a.id, owner);
  }
  return map;
}

/** Actor helpers */
async function getMyActorId() {
  const me = await getCurrentProfileId();
  if (!me) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', me)
    .limit(1)
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

async function getVportActorId(vportId) {
  if (!vportId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('vport_id', vportId)
    .limit(1)
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

/** Build block sets (actors I blocked / actors who blocked me) using actor columns */
async function getBlockSetsByActor(myActorId) {
  if (!myActorId) return { iBlockedActors: new Set(), blockedMeActors: new Set() };

  try {
    const [{ data: myBlocks, error: e1 }, { data: blockedBy, error: e2 }] = await Promise.all([
      supabase.schema('vc').from('user_blocks')
        .select('blocked_actor_id')
        .eq('blocker_actor_id', myActorId),
      supabase.schema('vc').from('user_blocks')
        .select('blocker_actor_id')
        .eq('blocked_actor_id', myActorId),
    ]);

    if (e1) throw e1;
    if (e2) throw e2;

    return {
      iBlockedActors: new Set((myBlocks ?? []).map(r => r.blocked_actor_id).filter(Boolean)),
      blockedMeActors: new Set((blockedBy ?? []).map(r => r.blocker_actor_id).filter(Boolean)),
    };
  } catch (err) {
    console.error('[notifications.getBlockSetsByActor] error:', err);
    return { iBlockedActors: new Set(), blockedMeActors: new Set() };
  }
}

/** Core filter: drop notifs from actors I blocked or who blocked me */
function filterByBlocks(rows, iBlockedActors, blockedMeActors) {
  if (!rows?.length) return [];
  return rows.filter(n => {
    if (!n.actor_id) return true; // system/broadcast notifications
    if (iBlockedActors.has(n.actor_id)) return false;
    if (blockedMeActors.has(n.actor_id)) return false;
    return true;
  });
}

/**
 * Identity helper:
 * - default: user inbox of current user-actor
 * - pass { type:'vport', vportId } to read a vport's inbox (owner-only; RLS enforces via actor_owners)
 * Returns:
 *   { targetActorId, myActorId, myProfileId }
 */
async function resolveInboxTarget(identity) {
  const myProfileId = await getCurrentProfileId();
  const myActorId = await getMyActorId();

  if (identity?.type === 'vport' && identity?.vportId) {
    const targetActorId = await getVportActorId(identity.vportId);
    return { targetActorId, myActorId, myProfileId };
  }

  // user inbox -> target is my own user-actor
  return { targetActorId: myActorId, myActorId, myProfileId };
}

/** List recent notifications for the given identity (user or vport) */
export async function listRecent({ limit = 50, offset = 0, identity } = {}) {
  const { targetActorId, myActorId } = await resolveInboxTarget(identity);
  if (!targetActorId) return [];

  // Build block sets using my actor id
  const { iBlockedActors, blockedMeActors } = await getBlockSetsByActor(myActorId);

  // 1) load notifications page for this inbox (RLS expects recipient_actor_id)
  const { data, error } = await supabase
    .schema('vc')
    .from('notifications')
    .select(
      'id, recipient_actor_id, user_id, vport_id, created_at, kind, object_type, object_id, link_path, context, is_seen, is_read, actor_id'
    )
    .eq('recipient_actor_id', targetActorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const rows = data || [];

  // 2) filter by blocks (actor-based)
  return filterByBlocks(rows, iBlockedActors, blockedMeActors);
}

/** Count unread notifications for the given identity (user or vport) */
export async function countUnread({ identity } = {}) {
  const { targetActorId, myActorId } = await resolveInboxTarget(identity);
  if (!targetActorId) return 0;

  const { iBlockedActors, blockedMeActors } = await getBlockSetsByActor(myActorId);

  const { data, error } = await supabase
    .schema('vc')
    .from('notifications')
    .select('id, actor_id')
    .eq('recipient_actor_id', targetActorId)
    .eq('is_read', false);

  if (error) throw error;

  const rows = data || [];
  const filtered = filterByBlocks(rows, iBlockedActors, blockedMeActors);
  return filtered.length;
}

/** Mark a single notification as read in the current inbox identity */
export async function markRead(id, { identity } = {}) {
  if (!id) return;
  const { targetActorId } = await resolveInboxTarget(identity);
  if (!targetActorId) return;

  const { error } = await supabase
    .schema('vc')
    .from('notifications')
    .update({ is_seen: true, is_read: true })
    .eq('id', id)
    .eq('recipient_actor_id', targetActorId);

  if (error) throw error;
}

/** Mark all as seen in the current inbox identity */
export async function markAllSeen({ identity } = {}) {
  const { targetActorId } = await resolveInboxTarget(identity);
  if (!targetActorId) return;

  const { error } = await supabase
    .schema('vc')
    .from('notifications')
    .update({ is_seen: true })
    .eq('recipient_actor_id', targetActorId)
    .eq('is_seen', false);

  if (error) throw error;
}

export default { listRecent, countUnread, markRead, markAllSeen };
