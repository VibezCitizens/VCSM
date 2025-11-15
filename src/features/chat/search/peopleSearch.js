// VERSION: 2025-11-03 (minor tune-ups)

import { supabase } from '@/lib/supabaseClient'

// Note: for exact @username / slug matches we try a fast path first,
// then fall back to ilike search for names.

export async function searchProfiles(query, limit = 12) {
  const q = (query || '').trim()
  if (!q) return []

  // Try exact username first
  const exactUsername = q.startsWith('@') ? q.slice(1) : q
  if (exactUsername) {
    const { data: exact, error: e1 } = await supabase
      .from('profiles')
      .select('id, display_name, username, photo_url')
      .ilike('username', exactUsername)
      .limit(1)

    if (e1) throw e1
    if (exact?.length) {
      return exact.map(p => ({
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

  return (data || []).map(p => ({
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

  const exactSlug = q.startsWith('@') ? q.slice(1) : q
  if (exactSlug) {
    const { data: exact, error: e1 } = await supabase
      .schema('vc')
      .from('vports')
      .select('id, name, slug, avatar_url')
      .ilike('slug', exactSlug)
      .limit(1)

    if (e1) throw e1
    if (exact?.length) {
      return exact.map(v => ({
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

  return (data || []).map(v => ({
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

// ---------- Actor resolvers (profile/vport -> vc.actors.id) ----------

export async function ensureActorByProfileId(profileId) {
  if (!profileId) throw new Error('profileId required')

  // Try existing
  {
    const { data, error } = await supabase
      .schema('vc')
      .from('actors')
      .select('id')
      .eq('kind', 'user')
      .eq('profile_id', profileId)
      .maybeSingle()
    if (error) throw error
    if (data?.id) return data.id
  }

  // Upsert
  {
    const res = await supabase
      .schema('vc')
      .from('actors')
      .upsert(
        [{ kind: 'user', profile_id: profileId }],
        { onConflict: 'profile_id' }
      )
      .select('id')
      .single()

    if (!res.error && res.data?.id) return res.data.id

    // Race-safe read
    const again = await supabase
      .schema('vc')
      .from('actors')
      .select('id')
      .eq('kind', 'user')
      .eq('profile_id', profileId)
      .maybeSingle()

    if (again.error) throw (res.error || again.error)
    if (again.data?.id) return again.data.id
    throw (res.error || new Error('ensureActorByProfileId failed'))
  }
}

export async function ensureActorByVportId(vportId) {
  if (!vportId) throw new Error('vportId required')

  // Try existing
  {
    const { data, error } = await supabase
      .schema('vc')
      .from('actors')
      .select('id')
      .eq('kind', 'vport')
      .eq('vport_id', vportId)
      .maybeSingle()
    if (error) throw error
    if (data?.id) return data.id
  }

  // Upsert
  {
    const res = await supabase
      .schema('vc')
      .from('actors')
      .upsert(
        [{ kind: 'vport', vport_id: vportId }],
        { onConflict: 'vport_id' }
      )
      .select('id')
      .single()

    if (!res.error && res.data?.id) return res.data.id

    // Race-safe read
    const again = await supabase
      .schema('vc')
      .from('actors')
      .select('id')
      .eq('kind', 'vport')
      .eq('vport_id', vportId)
      .maybeSingle()

    if (again.error) throw (res.error || again.error)
    if (again.data?.id) return again.data.id
    throw (res.error || new Error('ensureActorByVportId failed'))
  }
}
