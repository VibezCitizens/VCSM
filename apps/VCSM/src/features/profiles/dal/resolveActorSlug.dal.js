// [SHARED_ACTOR_PRIMITIVE] — polymorphic slug resolution (vport slug → user username → legacy)
import { supabase } from '@/services/supabase/supabaseClient'
import { createTTLCache } from '@/shared/lib/ttlCache'
import { appendIOSProdDebugLog } from '@/shared/lib/iosProdDebugger'

const SEO_TTL = 10 * 60 * 1000

const slugResolutionCache = createTTLCache(SEO_TTL)

/**
 * Resolve a UUID-free route param to an actorId.
 *
 * Tries in order:
 *   1. vport.profiles.slug  — vport actors (actor_id column)
 *   2. identity.actor_directory.username — canonical username map (vc domain)
 *   3. public.profiles.username → vc.actors.profile_id — legacy fallback
 *
 * @param {string} slugOrUsername — raw :actorId param that contains no UUID
 * @returns {Promise<{ actorId: string, kind: 'vport'|'user' }|null>}
 */
export async function resolveActorBySlugOrUsernameDAL(slugOrUsername) {
  if (!slugOrUsername || typeof slugOrUsername !== 'string') return null

  const key = slugOrUsername.toLowerCase()

  const cached = slugResolutionCache.get(key)
  if (cached) {
    appendIOSProdDebugLog('profile_slug_dal_cache_hit', {
      slug: key,
      actorId: cached.actorId,
      kind: cached.kind,
    })
    return cached
  }

  appendIOSProdDebugLog('profile_slug_dal_start', { slug: key })

  let hadQueryError = false

  // 1. Try vport slug
  const { data: vportData, error: vportErr } = await supabase
    .schema('vport')
    .from('profiles')
    .select('actor_id')
    .eq('slug', key)
    .maybeSingle()

  if (vportErr) {
    hadQueryError = true
    appendIOSProdDebugLog('profile_slug_dal_vport_query_error', {
      slug: key,
      message: vportErr.message,
    })
    console.error('[resolveActorBySlugOrUsernameDAL] vport.profiles query failed:', vportErr.message, { slug: key })
  }

  if (!vportErr && vportData?.actor_id) {
    const result = { actorId: vportData.actor_id, kind: 'vport' }
    slugResolutionCache.set(key, result)
    appendIOSProdDebugLog('profile_slug_dal_vport_hit', {
      slug: key,
      actorId: result.actorId,
    })
    return result
  }

  // 2. Try username via identity.actor_directory (source-of-truth lookup)
  // Compatibility: canonical slug for user actors normalizes underscores to
  // hyphens. Try both raw and hyphen/underscore-swapped candidates.
  const usernameCandidates = Array.from(new Set([
    key,
    key.replace(/-/g, '_'),
    key.replace(/_/g, '-'),
  ]))

  for (const candidate of usernameCandidates) {
    const { data: actorDirectoryRow, error: actorDirectoryErr } = await supabase
      .schema('identity')
      .from('actor_directory')
      .select('actor_id, actor_kind')
      .eq('actor_domain', 'vc')
      .ilike('username', candidate)
      .maybeSingle()

    if (actorDirectoryErr) {
      hadQueryError = true
      appendIOSProdDebugLog('profile_slug_dal_identity_query_error', {
        slug: key,
        username: candidate,
        message: actorDirectoryErr.message,
      })
      console.error('[resolveActorBySlugOrUsernameDAL] identity.actor_directory query failed:', actorDirectoryErr.message, { username: candidate })
      continue
    }

    if (actorDirectoryRow?.actor_id) {
      const kind = actorDirectoryRow.actor_kind === 'vport' ? 'vport' : 'user'
      const result = { actorId: actorDirectoryRow.actor_id, kind }
      slugResolutionCache.set(key, result)
      appendIOSProdDebugLog('profile_slug_dal_identity_hit', {
        slug: key,
        username: candidate,
        actorId: result.actorId,
        kind: result.kind,
      })
      return result
    }
  }

  // 3. Legacy fallback: public.profiles.username → vc.actors.profile_id
  let profileData = null
  let matchedUsername = null

  for (const candidate of usernameCandidates) {
    const { data, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', candidate)
      .maybeSingle()

    if (profileErr) {
      hadQueryError = true
      appendIOSProdDebugLog('profile_slug_dal_profile_query_error', {
        slug: key,
        username: candidate,
        message: profileErr.message,
      })
      console.error('[resolveActorBySlugOrUsernameDAL] public.profiles query failed:', profileErr.message, { username: candidate })
      continue
    }

    if (data?.id) {
      profileData = data
      matchedUsername = candidate
      break
    }
  }

  if (profileData?.id) {
    const { data: actorData, error: actorErr } = await supabase
      .schema('vc')
      .from('actors')
      .select('id')
      .eq('profile_id', profileData.id)
      .eq('kind', 'user')
      .eq('is_deleted', false)
      .maybeSingle()

    if (actorErr) {
      hadQueryError = true
      appendIOSProdDebugLog('profile_slug_dal_actor_query_error', {
        slug: key,
        username: matchedUsername,
        message: actorErr.message,
      })
      console.error('[resolveActorBySlugOrUsernameDAL] vc.actors query failed:', actorErr.message, { username: matchedUsername })
    }

    if (!actorErr && actorData?.id) {
      const result = { actorId: actorData.id, kind: 'user' }
      slugResolutionCache.set(key, result)
      appendIOSProdDebugLog('profile_slug_dal_legacy_hit', {
        slug: key,
        username: matchedUsername,
        actorId: result.actorId,
      })
      return result
    }
  }

  // Do not silently convert infrastructure/permission failures into "not found".
  if (hadQueryError) {
    const error = new Error(`Slug resolution query failed for ${slugOrUsername}`)
    error.code = 'SLUG_RESOLUTION_QUERY_FAILED'
    appendIOSProdDebugLog('profile_slug_dal_throw_query_error', {
      slug: key,
      code: error.code,
      message: error.message,
    })
    throw error
  }

  appendIOSProdDebugLog('profile_slug_dal_not_found', { slug: key })
  console.warn('[resolveActorBySlugOrUsernameDAL] not found:', slugOrUsername)
  return null
}

export function invalidateSlugResolutionCache(slugOrUsername) {
  slugOrUsername
    ? slugResolutionCache.invalidate(slugOrUsername.toLowerCase())
    : slugResolutionCache.invalidateAll()
}
