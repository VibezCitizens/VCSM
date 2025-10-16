// src/lib/actors/actors.js
// Resolve an actor_id (row in vc.actors) for the current identity.
// Supports both user and vport actors.

import { supabase } from '@/lib/supabaseClient';

// In-memory caches
const userActorCache  = new Map(); // userId  -> actorId
const vportActorCache = new Map(); // vportId -> actorId

export function clearActorCaches() {
  userActorCache.clear();
  vportActorCache.clear();
}

async function getAuthedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data?.user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

/** --- USER ACTOR --- **/
export async function getActorIdForUser(userId) {
  if (!userId) return null;
  if (userActorCache.has(userId)) return userActorCache.get(userId);

  // 1) read existing
  const { data: found, error: readErr } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('kind', 'user')
    .eq('profile_id', userId)
    .maybeSingle();

  // PGRST116 = "Results contain 0 rows" — not an error for maybeSingle
  if (readErr && readErr.code !== 'PGRST116') throw readErr;

  if (found?.id) {
    userActorCache.set(userId, found.id);
    return found.id;
  }

  // 2) create for myself (RLS ensures profile_id = auth.uid())
  let me = null;
  try { me = await getAuthedUserId(); } catch {}
  if (me && me === userId) {
    const { data: created, error: insErr } = await supabase
      .schema('vc')
      .from('actors')
      .insert({ kind: 'user', profile_id: userId })
      .select('id')
      .maybeSingle();

    if (insErr) throw insErr;

    if (created?.id) {
      userActorCache.set(userId, created.id);
      return created.id;
    }
  }
  return null;
}

/** --- VPORT ACTOR --- **/
export async function getActorIdForVport(vportId) {
  if (!vportId) return null;
  if (vportActorCache.has(vportId)) return vportActorCache.get(vportId);

  // 1) read existing
  const { data: found, error: readErr } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('kind', 'vport')
    .eq('vport_id', vportId)
    .maybeSingle();

  if (readErr && readErr.code !== 'PGRST116') throw readErr;

  if (found?.id) {
    vportActorCache.set(vportId, found.id);
    return found.id;
  }

  // 2) create (RLS on vc.actors should only allow the vport owner)
  const { data: created, error: insErr } = await supabase
    .schema('vc')
    .from('actors')
    .insert({ kind: 'vport', vport_id: vportId })
    .select('id')
    .maybeSingle();

  if (insErr) throw insErr;

  if (created?.id) {
    vportActorCache.set(vportId, created.id);
    return created.id;
  }
  return null;
}

/** --- CURRENT ACTOR --- **/
export async function getCurrentActorId({ userId, activeVportId } = {}) {
  if (activeVportId) return getActorIdForVport(activeVportId);
  const uid = userId || (await getAuthedUserId());
  return getActorIdForUser(uid);
}

/** Convenience wrapper */
export async function resolveActorId(options = {}) {
  const { userId, activeVportId } = options || {};
  return getCurrentActorId({ userId, activeVportId });
}

export default {
  getActorIdForUser,
  getActorIdForVport,
  getCurrentActorId,
  resolveActorId,
  clearActorCaches,
};
