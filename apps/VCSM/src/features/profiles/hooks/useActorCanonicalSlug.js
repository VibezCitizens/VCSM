// features/profiles/hooks/useActorCanonicalSlug.js
// ─────────────────────────────────────────────────────────────
// Fetches and returns the canonical SEO slug for an actor profile.
//
// The slug includes: name + category + city + state when available.
// Example output: "5c2c5402-...-marias-restaurant-laredo-tx"
//
// Used by ActorProfileScreen to:
//   1. Know the canonical URL before rendering profile content
//   2. Pass the canonical slug to useActorSlugRedirect
//
// The controller result is cached at the controller level (10-minute TTL),
// so navigating back to a profile does not trigger re-fetching.
//
// Layer: Hook — React lifecycle management, calls controller.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { buildActorCanonicalSlugController } from '@/features/profiles/controller/buildActorCanonicalSlug.controller'
import { appendIOSProdDebugLog } from '@/shared/lib/iosProdDebugger'

/**
 * @param {string|null} actorId — resolved UUID from the route param
 * @returns {{
 *   canonicalSlug: string|null,  — full canonical slug param (uuid + readable suffix)
 *   slugParts: Object,           — { name, category, city, state }
 *   loading: boolean,
 *   error: Error|null,
 * }}
 */
export function useActorCanonicalSlug(actorId) {
  const [canonicalSlug, setCanonicalSlug] = useState(null)
  const [slugParts, setSlugParts] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resolvedActorId, setResolvedActorId] = useState(null)

  useEffect(() => {
    let alive = true

    async function run() {
      if (!actorId) {
        appendIOSProdDebugLog('profile_canonical_slug_skipped', { actorId })
        if (alive) {
          setCanonicalSlug(null)
          setSlugParts({})
          setError(null)
          setLoading(false)
          setResolvedActorId(null)
        }
        return
      }

      try {
        appendIOSProdDebugLog('profile_canonical_slug_start', { actorId })
        setLoading(true)
        setError(null)

        const { canonicalSlug: slug, slugParts: parts } =
          await buildActorCanonicalSlugController(actorId)

        if (!alive) return
        appendIOSProdDebugLog('profile_canonical_slug_resolved', {
          actorId,
          canonicalSlug: slug,
          slugParts: parts ?? {},
        })
        setCanonicalSlug(slug)
        setSlugParts(parts ?? {})
        setResolvedActorId(actorId)
      } catch (e) {
        if (!alive) return
        appendIOSProdDebugLog('profile_canonical_slug_error', {
          actorId,
          message: e?.message ?? String(e),
        })
        setError(e)
        // Fallback to bare actorId so a network failure doesn't redirect to /feed.
        // The profile renders at /profile/{uuid} rather than bouncing the user.
        setCanonicalSlug(actorId)
        setResolvedActorId(actorId)
      } finally {
        if (alive) setLoading(false)
      }
    }

    run()
    return () => { alive = false }
  }, [actorId])

  const isResolvedForCurrentActor = !!actorId && resolvedActorId === actorId
  const pendingForCurrentActor = !!actorId && !isResolvedForCurrentActor

  return {
    canonicalSlug: isResolvedForCurrentActor ? canonicalSlug : null,
    slugParts: isResolvedForCurrentActor ? slugParts : {},
    loading: loading || pendingForCurrentActor,
    error: isResolvedForCurrentActor ? error : null,
  }
}
