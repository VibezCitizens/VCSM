// features/profiles/dal/readActorSeoData.dal.js
// ─────────────────────────────────────────────────────────────
// DAL functions that collect the fields needed to build a canonical
// SEO slug for an actor profile URL.
//
// Each function has single responsibility — one table, explicit columns.
// The controller (buildActorCanonicalSlug) calls them in parallel.
//
// Sources:
//   vc.actors + public.profiles  — actor_kind, display_name, username
//   vport.profiles               — name, slug (existing human-readable id)
//   vport.profile_public_details — location_text, address (city/state)
//   vport.profile_categories     — primary category key
//   vport.categories             — category label
//
// Reverse slug resolution (slug/username → actorId) lives in resolveActorSlug.dal.js
//
// Layer: DAL — raw Supabase queries only, no business logic.
// ─────────────────────────────────────────────────────────────

import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'

// ─────────────────────────────────────────────────────────────
// 0. vport.public_actor_seo_v — single-query replacement for
//    the four individual functions below. Used by the redirect
//    screen (/m/:actorId) and canonical slug controller.
// ─────────────────────────────────────────────────────────────

const seoViewCache = createTTLCache(10 * 60 * 1000)

const SEO_VIEW_COLS = [
  'actor_id',
  'actor_kind',
  'profile_id',
  'profile_display_name',
  'profile_username',
  'vport_profile_id',
  'vport_name',
  'vport_slug',
  'vport_bio',
  'vport_avatar_url',
  'vport_banner_url',
  'location_text',
  'address',
  'primary_category_key',
  'primary_category_label',
].join(', ')

export async function readActorSeoViewDAL(actorId) {
  if (!actorId) return null

  const cached = seoViewCache.get(actorId)
  if (cached) return cached

  const { data, error } = await supabase
    .schema('vport')
    .from('public_actor_seo_v')
    .select(SEO_VIEW_COLS)
    .eq('actor_id', actorId)
    .limit(1)
    .maybeSingle()

  if (error) {
    if (import.meta.env?.DEV) console.warn('[readActorSeoViewDAL]', error.message)
    return null
  }

  if (data) seoViewCache.set(actorId, data)
  return data ?? null
}

export function invalidateActorSeoViewCache(actorId) {
  actorId ? seoViewCache.invalidate(actorId) : seoViewCache.invalidateAll()
}

// SEO slug data changes rarely — 10-minute cache is safe.
const SEO_TTL = 10 * 60 * 1000

const actorDirectoryCache = createTTLCache(SEO_TTL)
const vportProfileCache   = createTTLCache(SEO_TTL)
const publicDetailsCache  = createTTLCache(SEO_TTL)
const categoryCache       = createTTLCache(SEO_TTL)

// ─────────────────────────────────────────────────────────────
// 1. vc.actors + public.profiles — actor_kind + display_name + username
// ─────────────────────────────────────────────────────────────

export async function readActorDirectoryRowDAL(actorId) {
  if (!actorId) return null

  const cached = actorDirectoryCache.get(actorId)
  if (cached) return cached

  const { data: actorRow, error: actorErr } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, kind, profile_id')
    .eq('id', actorId)
    .maybeSingle()

  if (actorErr) {
    if (import.meta.env?.DEV) console.warn('[readActorDirectoryRowDAL] vc.actors:', actorErr.message)
    return null
  }

  if (!actorRow) return null

  let display_name = null
  let username = null

  if (actorRow.profile_id) {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', actorRow.profile_id)
      .maybeSingle()

    if (!profileErr && profile) {
      display_name = profile.display_name ?? null
      username = profile.username ?? null
    }
  }

  const result = {
    actor_id: actorRow.id,
    actor_kind: actorRow.kind ?? null,
    display_name,
    username,
  }

  actorDirectoryCache.set(actorId, result)
  return result
}

export function invalidateActorDirectoryCache(actorId) {
  actorId ? actorDirectoryCache.invalidate(actorId) : actorDirectoryCache.invalidateAll()
}

// ─────────────────────────────────────────────────────────────
// 2. vport.profiles — business name + existing slug
// ─────────────────────────────────────────────────────────────

export async function readVportProfileByActorDAL(actorId) {
  if (!actorId) return null

  const cached = vportProfileCache.get(actorId)
  if (cached) return cached

  const { data, error } = await supabase
    .schema('vport')
    .from('profiles')
    .select('id, actor_id, name, slug')
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) {
    if (import.meta.env?.DEV) console.warn('[readVportProfileByActorDAL]', error.message)
    return null
  }

  if (data) vportProfileCache.set(actorId, data)
  return data ?? null
}

export function invalidateVportProfileSeoCache(actorId) {
  actorId ? vportProfileCache.invalidate(actorId) : vportProfileCache.invalidateAll()
}

// ─────────────────────────────────────────────────────────────
// 3. vport.profile_public_details — location_text + address
// ─────────────────────────────────────────────────────────────

export async function readVportPublicDetailsForSeoDAL(profileId) {
  if (!profileId) return null

  const cached = publicDetailsCache.get(profileId)
  if (cached) return cached

  const { data, error } = await supabase
    .schema('vport')
    .from('profile_public_details')
    .select('location_text, address')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    if (import.meta.env?.DEV) console.warn('[readVportPublicDetailsForSeoDAL]', error.message)
    return null
  }

  if (data) publicDetailsCache.set(profileId, data)
  return data ?? null
}

export function invalidateVportPublicDetailsSeoCache(profileId) {
  profileId ? publicDetailsCache.invalidate(profileId) : publicDetailsCache.invalidateAll()
}

// ─────────────────────────────────────────────────────────────
// 4. vport.profile_categories + vport.categories — primary category label
// ─────────────────────────────────────────────────────────────

export async function readVportPrimaryCategoryDAL(profileId) {
  if (!profileId) return null

  const cached = categoryCache.get(profileId)
  if (cached) return cached

  const { data, error } = await supabase
    .schema('vport')
    .from('profile_categories')
    .select('category_key, is_primary, categories(key, label)')
    .eq('profile_id', profileId)
    .eq('is_primary', true)
    .maybeSingle()

  if (error) {
    if (import.meta.env?.DEV) console.warn('[readVportPrimaryCategoryDAL]', error.message)
    return null
  }

  const result = data?.categories
    ? { key: data.categories.key, label: data.categories.label }
    : null

  if (result) categoryCache.set(profileId, result)
  return result
}

export function invalidateVportCategoryCache(profileId) {
  profileId ? categoryCache.invalidate(profileId) : categoryCache.invalidateAll()
}
