// src/data/user/notifications.js
// Hides notifications from users I blocked or who blocked me.

import { supabase } from '@/lib/supabaseClient';

/** auth.uid() == profiles.id in your setup */
async function getCurrentProfileId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id ?? null;
}

async function getBlockSets(meId) {
  if (!meId) return { iBlocked: new Set(), blockedMe: new Set() };

  try {
    const [{ data: myBlocks, error: e1 }, { data: blockedBy, error: e2 }] =
      await Promise.all([
        supabase.schema('vc').from('user_blocks').select('blocked_id').eq('blocker_id', meId),
        supabase.schema('vc').from('user_blocks').select('blocker_id').eq('blocked_id', meId),
      ]);

    if (e1) throw e1;
    if (e2) throw e2;

    return {
      iBlocked: new Set((myBlocks ?? []).map(r => r.blocked_id)),
      blockedMe: new Set((blockedBy ?? []).map(r => r.blocker_id)),
    };
  } catch (err) {
    console.error('[notifications.getBlockSets] error:', err);
    return { iBlocked: new Set(), blockedMe: new Set() };
  }
}

/** batch resolve actor_id -> profile_id */
async function resolveActorOwners(actorIds) {
  if (!actorIds.length) return new Map();
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, profile_id')
    .in('id', actorIds);
  if (error) throw error;
  return new Map((data || []).map(a => [a.id, a.profile_id]));
}

/** core filter */
function filterByBlocks(rows, actorOwnerMap, iBlocked, blockedMe) {
  if (!rows?.length) return [];
  return rows.filter(n => {
    if (!n.actor_id) return true; // system/broadcast notifications
    const owner = actorOwnerMap.get(n.actor_id);
    if (!owner) return false;     // conservative: drop if unknown
    if (iBlocked.has(owner)) return false;
    if (blockedMe.has(owner)) return false;
    return true;
  });
}

export async function listRecent({ limit = 50, offset = 0 } = {}) {
  const meId = await getCurrentProfileId();
  const { iBlocked, blockedMe } = await getBlockSets(meId);

  // 1) load notifications page for ME
  const { data, error } = await supabase
    .schema('vc')
    .from('notifications')
    .select('id, user_id, created_at, kind, object_type, object_id, link_path, context, is_seen, is_read, actor_id')
    .eq('user_id', meId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  const rows = data || [];

  // 2) resolve actor owners for this page
  const actorIds = [...new Set(rows.map(r => r.actor_id).filter(Boolean))];
  const actorOwnerMap = await resolveActorOwners(actorIds);

  // 3) filter
  return filterByBlocks(rows, actorOwnerMap, iBlocked, blockedMe);
}

export async function countUnread() {
  const meId = await getCurrentProfileId();
  const { iBlocked, blockedMe } = await getBlockSets(meId);

  // fetch unread for ME
  const { data, error } = await supabase
    .schema('vc')
    .from('notifications')
    .select('id, actor_id')
    .eq('user_id', meId)
    .eq('is_read', false);
  if (error) throw error;

  const rows = data || [];
  const actorIds = [...new Set(rows.map(r => r.actor_id).filter(Boolean))];
  const actorOwnerMap = await resolveActorOwners(actorIds);
  const filtered = filterByBlocks(rows, actorOwnerMap, iBlocked, blockedMe);

  return filtered.length;
}

export async function markRead(id) {
  if (!id) return;
  const meId = await getCurrentProfileId();
  const { error } = await supabase
    .schema('vc')
    .from('notifications')
    .update({ is_seen: true, is_read: true })
    .eq('user_id', meId)
    .eq('id', id);
  if (error) throw error;
}

export async function markAllSeen() {
  const meId = await getCurrentProfileId();
  const { error } = await supabase
    .schema('vc')
    .from('notifications')
    .update({ is_seen: true })
    .eq('user_id', meId)
    .eq('is_seen', false);
  if (error) throw error;
}

export default { listRecent, countUnread, markRead, markAllSeen };
