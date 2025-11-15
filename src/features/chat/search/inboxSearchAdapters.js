// src/features/chat/search/inboxSearchAdapters.js
// VERSION: 2025-11-11 (actorless client + sanity override if kind mismatched)

import { supabase } from '@/lib/supabaseClient'

// ---------- tiny utils ----------
const isUuid = (s) =>
  typeof s === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

// ---------- RPC helpers (SECURITY DEFINER on the server) ----------
async function actorIdForProfile(profileId) {
  const { data, error } = await supabase
    .schema('vc')
    .rpc('actor_id_for_profile', { p_profile_id: profileId })
  if (error) throw error
  if (!data) throw new Error('actor_id_for_profile returned null')
  return data
}

async function actorIdForVport(vportId) {
  const { data, error } = await supabase
    .schema('vc')
    .rpc('actor_id_for_vport', { p_vport_id: vportId })
  if (error) throw error
  if (!data) throw new Error('actor_id_for_vport returned null')
  return data
}

// ---------- Directory search (users + vports) ----------
export async function searchProfiles(query, limit = 12) {
  const q = (query || '').trim()
  if (!q) return []

  const exact = q.startsWith('@') ? q.slice(1) : q
  if (exact) {
    const { data: hit, error: e1 } = await supabase
      .from('profiles')
      .select('id, display_name, username, photo_url')
      .ilike('username', exact)
      .limit(1)
    if (e1) throw e1
    if (hit?.length) {
      return hit.map((p) => ({
        kind: 'user',
        id: p.id,
        display_name: p.display_name ?? null,
        username: p.username ?? null,
        photo_url: p.photo_url ?? null,
      }))
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, photo_url')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .order('display_name', { ascending: true })
    .limit(limit)
  if (error) throw error

  return (data || []).map((p) => ({
    kind: 'user',
    id: p.id,
    display_name: p.display_name ?? null,
    username: p.username ?? null,
    photo_url: p.photo_url ?? null,
  }))
}

export async function searchVports(query, limit = 12) {
  const q = (query || '').trim()
  if (!q) return []

  const exact = q.startsWith('@') ? q.slice(1) : q
  if (exact) {
    const { data: hit, error: e1 } = await supabase
      .schema('vc')
      .from('vports')
      .select('id, name, slug, avatar_url')
      .ilike('slug', exact)
      .limit(1)
    if (e1) throw e1
    if (hit?.length) {
      return hit.map((v) => ({
        kind: 'vport',
        id: v.id,
        display_name: v.name ?? null,
        username: v.slug ?? null,
        photo_url: v.avatar_url ?? null,
      }))
    }
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('vports')
    .select('id, name, slug, avatar_url')
    .or(`slug.ilike.%${q}%,name.ilike.%${q}%`)
    .order('name', { ascending: true })
    .limit(limit)
  if (error) throw error

  return (data || []).map((v) => ({
    kind: 'vport',
    id: v.id,
    display_name: v.name ?? null,
    username: v.slug ?? null,
    photo_url: v.avatar_url ?? null,
  }))
}

export async function searchDirectory(query, limitPerKind = 8) {
  const [users, vports] = await Promise.all([
    searchProfiles(query, limitPerKind),
    searchVports(query, limitPerKind),
  ])
  return [...users, ...vports]
}

// ---------- Modal adapter ----------
export async function inboxOnSearch(query, opts = {}) {
  const {
    kinds = 'both',
    excludeProfileId,
    excludeVportId,
    currentActorId,
    limitPerKind = 8,
  } = opts

  let rows = []
  if (kinds === 'users') rows = await searchProfiles(query, limitPerKind)
  else if (kinds === 'vports') rows = await searchVports(query, limitPerKind)
  else rows = await searchDirectory(query, limitPerKind)

  if (excludeProfileId) rows = rows.filter((r) => !(r.kind === 'user' && r.id === excludeProfileId))
  if (excludeVportId) rows = rows.filter((r) => !(r.kind === 'vport' && r.id === excludeVportId))

  if (currentActorId) {
    rows = rows.filter((r) => r.actor_id !== currentActorId && r.actorId !== currentActorId)
  }

  // normalized shape + carry _kind
  return rows.map((r) => ({
    id: r.id,
    display_name: r.display_name ?? null,
    username: r.username ?? null,
    photo_url: r.photo_url ?? null,
    _kind: r.kind, // authoritative
  }))
}

// ---------- pick -> actor_id (no client writes to vc.actors) ----------
export async function resolvePickedToActorId(picked) {
  if (!picked) throw new Error('resolvePickedToActorId: missing input')

  if (picked.actor_id && isUuid(picked.actor_id)) return picked.actor_id

  let explicitKind = picked._kind || picked.kind || null
  const rawId = picked.id
  const idIsUuid = isUuid(rawId)

  // Sanity override: if a kind is provided but clearly mismatches table membership, fix it.
  // This prevents FK 23503 when a vport row was mislabeled as user.
  if (idIsUuid && explicitKind) {
    const [isV, isU] = await Promise.all([
      supabase.schema('vc').from('vports').select('id').eq('id', rawId).maybeSingle(),
      supabase.from('profiles').select('id').eq('id', rawId).maybeSingle(),
    ])
    if (isV?.data?.id && explicitKind !== 'vport') explicitKind = 'vport'
    else if (isU?.data?.id && explicitKind !== 'user') explicitKind = 'user'
  }

  // Fast paths when we know the kind
  if (explicitKind === 'vport' && idIsUuid) return await actorIdForVport(rawId)
  if (explicitKind === 'user'  && idIsUuid) return await actorIdForProfile(rawId)

  // UUID but unknown kind: probe both tables (no writes)
  if (idIsUuid && !explicitKind) {
    const [vHit, uHit] = await Promise.all([
      supabase.schema('vc').from('vports').select('id').eq('id', rawId).maybeSingle(),
      supabase.from('profiles').select('id').eq('id', rawId).maybeSingle(),
    ])
    if (vHit?.data?.id) return await actorIdForVport(rawId)
    if (uHit?.data?.id) return await actorIdForProfile(rawId)
    // Fall through to free-text if uuid not found
  }

  // Free-text fallback
  const qRaw = String(picked.username || picked.display_name || picked.id || '').trim()
  if (!qRaw) throw new Error('resolvePickedToActorId: empty query')
  const q = qRaw.startsWith('@') ? qRaw.slice(1) : qRaw

  const [users, vports] = await Promise.all([searchProfiles(q, 1), searchVports(q, 1)])
  if (vports.length && isUuid(vports[0].id)) return await actorIdForVport(vports[0].id)
  if (users.length && isUuid(users[0].id))  return await actorIdForProfile(users[0].id)

  const dir = await searchDirectory(q, 1)
  if (dir.length && isUuid(dir[0].id)) {
    return dir[0].kind === 'vport'
      ? await actorIdForVport(dir[0].id)
      : await actorIdForProfile(dir[0].id)
  }

  throw new Error('Could not resolve a matching actor from selection')
}
