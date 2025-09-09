import { supabase } from '@/lib/supabaseClient';

/* Unified actor_id resolver (profile or vport) + re-exports from './actor' */

async function getAuthedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data?.user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

function readActiveVportFromStorage() {
  try {
    const kind = localStorage.getItem('actor_kind');
    if (kind !== 'vport') return null;
    return localStorage.getItem('actor_vport_id') || null;
  } catch {
    return null;
  }
}

export async function getActorIdForUser(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.rpc('actor_id_for_user', { u_id: userId });
  if (error) throw error;
  if (data) return data;

  const me = await getAuthedUserId();
  if (me !== userId) return null;

  const { data: createdId, error: createErr } = await supabase.rpc('get_or_create_user_actor');
  if (createErr) throw createErr;
  return createdId || null;
}

export async function getActorIdForVport(vportId) {
  if (!vportId) return null;
  const { data, error } = await supabase.rpc('actor_id_for_vport', { v_id: vportId });
  if (error) throw error;
  return data || null;
}

/**
 * resolveActorId(options)
 * Supports BOTH:
 *  - { actingAsVport, profileId, vportId }           // used by likes.js
 *  - { userId, activeVportId }                       // legacy/alt
 */
export async function resolveActorId(options = {}) {
  if ('actingAsVport' in options || 'profileId' in options || 'vportId' in options) {
    const acting = !!options.actingAsVport;
    if (acting) {
      const vId = options.vportId || readActiveVportFromStorage();
      if (!vId) throw new Error('resolveActorId: vportId is required when actingAsVport=true');
      return getActorIdForVport(vId);
    }
    const profileId = options.profileId || (await getAuthedUserId());
    return getActorIdForUser(profileId);
  }

  const userId = options.userId || (await getAuthedUserId());
  const activeVportId = options.activeVportId || readActiveVportFromStorage();
  if (activeVportId) return getActorIdForVport(activeVportId);
  return getActorIdForUser(userId);
}

export async function getCurrentActorId({ userId, activeVportId }) {
  if (activeVportId) return getActorIdForVport(activeVportId);
  const uid = userId || (await getAuthedUserId());
  return getActorIdForUser(uid);
}

// default (optional)
const actorsApi = {
  getActorIdForUser,
  getActorIdForVport,
  getCurrentActorId,
  resolveActorId,
};
export default actorsApi;

// Re-export client actor helpers so both import paths work
export { getActor, setActor, onActorChange } from './actor';
