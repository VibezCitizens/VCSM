// features/profiles/hooks/useResolveActorBySlug.js
// ─────────────────────────────────────────────────────────────
// Resolves a UUID-free slug or username route param → actorId.
//
// Used by ActorProfileScreen when the URL contains no UUID prefix —
// i.e. the new canonical format like /profile/tyba-restaurant or
// /profile/architect.
//
// Short-circuits (returns null, not loading) when slug is null or
// appears to be a UUID-based param — those are handled by the
// extractActorIdFromSlug path instead.
//
// Layer: Hook — React lifecycle management, calls DAL directly
// (no business logic, so no controller layer needed).
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { resolveActorBySlugOrUsernameDAL } from '@/features/profiles/dal/readActorSeoData.dal'
import { appendIOSProdDebugLog } from '@/shared/lib/iosProdDebugger'

/**
 * @param {string|null} slug — UUID-free route param (e.g. "tyba-restaurant")
 * @returns {{
 *   actorId: string|null,
 *   kind: 'vport'|'user'|null,
 *   loading: boolean,
 *   notFound: boolean,
 *   error: Error|null,
 * }}
 */
export function useResolveActorBySlug(slug) {
  const [actorId, setActorId] = useState(null)
  const [kind, setKind] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(null)
  const [resolvedSlug, setResolvedSlug] = useState(null)

  useEffect(() => {
    let alive = true

    if (!slug) {
      appendIOSProdDebugLog('profile_slug_resolve_skipped', { slug })
      setActorId(null)
      setKind(null)
      setLoading(false)
      setNotFound(false)
      setError(null)
      setResolvedSlug(null)
      return
    }

    async function run() {
      appendIOSProdDebugLog('profile_slug_resolve_start', { slug })
      setLoading(true)
      setNotFound(false)
      setError(null)

      try {
        const result = await resolveActorBySlugOrUsernameDAL(slug)

        if (!alive) return

        if (result) {
          appendIOSProdDebugLog('profile_slug_resolve_hit', {
            slug,
            actorId: result.actorId,
            kind: result.kind,
          })
          setActorId(result.actorId)
          setKind(result.kind)
          setNotFound(false)
        } else {
          appendIOSProdDebugLog('profile_slug_resolve_not_found', { slug })
          setActorId(null)
          setKind(null)
          setNotFound(true)
        }
        setResolvedSlug(slug)
      } catch (e) {
        if (!alive) return
        appendIOSProdDebugLog('profile_slug_resolve_error', {
          slug,
          code: e?.code ?? null,
          message: e?.message ?? String(e),
        })
        setActorId(null)
        setKind(null)
        setNotFound(false)
        setError(e instanceof Error ? e : new Error('Slug resolution failed'))
        setResolvedSlug(slug)
      } finally {
        if (alive) setLoading(false)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [slug])

  const isResolvedForCurrentSlug = !!slug && resolvedSlug === slug
  const pendingForCurrentSlug = !!slug && !isResolvedForCurrentSlug

  return {
    actorId: isResolvedForCurrentSlug ? actorId : null,
    kind: isResolvedForCurrentSlug ? kind : null,
    loading: loading || pendingForCurrentSlug,
    notFound: isResolvedForCurrentSlug ? notFound : false,
    error: isResolvedForCurrentSlug ? error : null,
  }
}
