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
// Layer: DAL — raw Supabase queries only, no business logic.
// ─────────────────────────────────────────────────────────────

import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'

// SEO slug data changes rarely — 10-minute cache is safe.
const SEO_TTL = 10 * 60 * 1000

const actorDirectoryCache = createTTLCache(SEO_TTL)
const vportProfileCache   = createTTLCache(SEO_TTL)
const publicDetailsCache  = createTTLCache(SEO_TTL)
const categoryCache       = createTTLCache(SEO_TTL)

// ─────────────────────────────────────────────────────────────
// 1. vc.actors + public.profiles — actor_kind + display_name + username
// ─────────────────────────────────────────────────────────────

/**
 * Read actor kind and user display name for a given actorId.
 *
 * Two-step:
 *   1. vc.actors → id, kind, profile_id
 *   2. public.profiles → display_name, username  (user actors only; null for vports)
 *
 * Vport name/slug comes from readVportProfileByActorDAL, not here.
 *
 * @param {string} actorId
 * @returns {Promise<Object|null>} — { actor_id, actor_kind, display_name, username }
 */
export async function readActorDirectoryRowDAL(actorId) {
  if (!actorId) return null

  const cached = actorDirectoryCache.get(actorId)
  if (cached) return cached

  // Step 1: resolve actor kind and profile linkage
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

  // Step 2: user actors have a profile_id → fetch display name + username
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

/**
 * Read the vport profile row by actor_id.
 * Returns the stored slug (already human-readable) and raw business name.
 * Only populated when actor.kind === 'vport'.
 *
 * @param {string} actorId
 * @returns {Promise<Object|null>} — { id, actor_id, name, slug }
 */
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

/**
 * Read public location details for a vport profile.
 * location_text is a free-text string (e.g., "Laredo, TX").
 * address is a jsonb object that may have { city, state, ... }.
 *
 * @param {string} profileId — vport.profiles.id (NOT actor_id)
 * @returns {Promise<Object|null>} — { location_text, address }
 */
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

/**
 * Read the primary category for a vport profile.
 * Joins profile_categories → categories to get the human-readable label.
 *
 * @param {string} profileId — vport.profiles.id
 * @returns {Promise<Object|null>} — { key, label }
 */
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

  // Flatten the nested join result into { key, label }
  const result = data?.categories
    ? { key: data.categories.key, label: data.categories.label }
    : null

  if (result) categoryCache.set(profileId, result)
  return result
}

export function invalidateVportCategoryCache(profileId) {
  profileId ? categoryCache.invalidate(profileId) : categoryCache.invalidateAll()
}

// ─────────────────────────────────────────────────────────────
// 5. Reverse lookup — slug or username → actorId
// ─────────────────────────────────────────────────────────────

const slugResolutionCache = createTTLCache(SEO_TTL)

/**
 * Resolve a UUID-free route param to an actorId.
 *
 * Tries in order:
 *   1. vport.profiles.slug  — vport actors (actor_id column)
 *   2. public.profiles.username → vc.actors.profile_id — user actors
 *
 * @param {string} slugOrUsername — raw :actorId param that contains no UUID
 * @returns {Promise<{ actorId: string, kind: 'vport'|'user' }|null>}
 */
export async function resolveActorBySlugOrUsernameDAL(slugOrUsername) {
  if (!slugOrUsername || typeof slugOrUsername !== 'string') return null

  const key = slugOrUsername.toLowerCase()

  const cached = slugResolutionCache.get(key)
  if (cached) return cached

  // 1. Try vport slug
  const { data: vportData, error: vportErr } = await supabase
    .schema('vport')
    .from('profiles')
    .select('actor_id')
    .eq('slug', key)
    .maybeSingle()

  if (vportErr) {
    console.error('[resolveActorBySlugOrUsernameDAL] vport.profiles query failed:', vportErr.message, { slug: key })
  }

  if (!vportErr && vportData?.actor_id) {
    const result = { actorId: vportData.actor_id, kind: 'vport' }
    slugResolutionCache.set(key, result)
    return result
  }

  // 2. Try username → profile_id → actor_id (ilike = case-insensitive match)
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', key)
    .maybeSingle()

  if (profileErr) {
    console.error('[resolveActorBySlugOrUsernameDAL] public.profiles query failed:', profileErr.message, { username: key })
  }

  if (!profileErr && profileData?.id) {
    const { data: actorData, error: actorErr } = await supabase
      .schema('vc')
      .from('actors')
      .select('id')
      .eq('profile_id', profileData.id)
      .eq('kind', 'user')
      .maybeSingle()

    if (actorErr) {
      console.error('[resolveActorBySlugOrUsernameDAL] vc.actors query failed:', actorErr.message)
    }

    if (!actorErr && actorData?.id) {
      const result = { actorId: actorData.id, kind: 'user' }
      slugResolutionCache.set(key, result)
      return result
    }
  }

  console.warn('[resolveActorBySlugOrUsernameDAL] not found:', slugOrUsername)
  return null
}

export function invalidateSlugResolutionCache(slugOrUsername) {
  slugOrUsername
    ? slugResolutionCache.invalidate(slugOrUsername.toLowerCase())
    : slugResolutionCache.invalidateAll()
}
