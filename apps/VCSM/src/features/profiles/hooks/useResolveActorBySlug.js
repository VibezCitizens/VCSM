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

  useEffect(() => {
    let alive = true

    if (!slug) {
      setActorId(null)
      setKind(null)
      setLoading(false)
      setNotFound(false)
      setError(null)
      return
    }

    async function run() {
      setLoading(true)
      setNotFound(false)
      setError(null)

      try {
        const result = await resolveActorBySlugOrUsernameDAL(slug)

        if (!alive) return

        if (result) {
          setActorId(result.actorId)
          setKind(result.kind)
          setNotFound(false)
        } else {
          setActorId(null)
          setKind(null)
          setNotFound(true)
        }
      } catch (e) {
        if (!alive) return
        setActorId(null)
        setKind(null)
        setNotFound(false)
        setError(e instanceof Error ? e : new Error('Slug resolution failed'))
      } finally {
        if (alive) setLoading(false)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [slug])

  return { actorId, kind, loading, notFound, error }
}
