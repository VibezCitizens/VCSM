// src/lib/actor.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Memoized resolver for (kind, profile_id, vport_id) -> actors.id
 * kind: 'user' | 'vport'
 */
const _cache = new Map(); // key: `${kind}:${profileId ?? ''}:${vportId ?? ''}`

export async function getOrCreateActorId({ kind, profileId = null, vportId = null }) {
  if (kind !== 'user' && kind !== 'vport') {
    throw new Error('getOrCreateActorId: kind must be "user" or "vport"');
  }
  const key = `${kind}:${profileId ?? ''}:${vportId ?? ''}`;
  if (_cache.has(key)) return _cache.get(key);

  // Try find
  let q = supabase.from('actors').select('id').limit(1);
  q = kind === 'user' ? q.eq('kind', 'user').eq('profile_id', profileId) 
                      : q.eq('kind', 'vport').eq('vport_id', vportId);
  const find = await q.maybeSingle();
  if (find.error && find.error.code !== 'PGRST116') throw find.error;
  if (find.data?.id) {
    _cache.set(key, find.data.id);
    return find.data.id;
  }

  // Create
  const ins = await supabase
    .from('actors')
    .insert([{ kind, profile_id: profileId, vport_id: vportId }])
    .select('id')
    .single();
  if (ins.error) throw ins.error;

  _cache.set(key, ins.data.id);
  return ins.data.id;
}

/**
 * Resolve actor for a runtime identity shape:
 *  - actingAsVport=true + vportId -> that vport actor
 *  - else -> user actor (profileId required)
 */
export async function resolveActorId({ actingAsVport = false, profileId, vportId = null }) {
  if (actingAsVport) {
    if (!vportId) throw new Error('resolveActorId: vportId required when actingAsVport');
    return getOrCreateActorId({ kind: 'vport', vportId });
  }
  if (!profileId) throw new Error('resolveActorId: profileId required');
  return getOrCreateActorId({ kind: 'user', profileId });
}
