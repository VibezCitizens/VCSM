// features/profiles/hooks/useActorSlugRedirect.js
// ─────────────────────────────────────────────────────────────
// Enforces the one canonical SEO slug URL for an actor profile.
//
// Receives the canonical slug from useActorCanonicalSlug (which has already
// fetched name + category + city + state). When routeParam differs from
// canonicalSlug, fires navigate({ replace: true }) so the browser history
// never accumulates non-canonical entries.
//
// ActorProfileScreen blocks content rendering (shows skeleton) until
// canonicalSlug is known AND routeParam matches it. This guarantees
// users never see profile content at a non-canonical URL.
//
// Backward compatibility:
//   /profile/{uuid}                → redirects to full canonical slug
//   /profile/{uuid}-{partial-slug} → redirects to full canonical slug
//   /profile/{uuid}-{full-slug}    → no redirect, renders immediately
//
// Layer: Hook — navigation side effect only, no business logic.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * @param {string}      routeParam      — raw :actorId value from useParams()
 * @param {string|null} canonicalSlug   — full canonical slug from useActorCanonicalSlug
 * @param {string|null} resolvedActorId — actorId already known at the source URL, forwarded
 *                                        in router state for informational use at the destination
 */
export function useActorSlugRedirect(routeParam, canonicalSlug, resolvedActorId) {
  const navigate = useNavigate()

  // Guard: redirect fires at most once per mount/slug pair.
  // Resets automatically when canonicalSlug changes (new actor).
  const lastRedirectedTo = useRef(null)

  useEffect(() => {
    // Wait until we have the canonical slug
    if (!canonicalSlug) return

    // Already on canonical URL — nothing to do
    if (routeParam === canonicalSlug) return

    // Already redirected to this exact slug this session — avoid loop
    if (lastRedirectedTo.current === canonicalSlug) return

    lastRedirectedTo.current = canonicalSlug

    // Forward actorId in state for informational use at the destination.
    // The destination screen always performs its own strict resolution —
    // this state does NOT bypass any DB lookup.
    navigate(`/profile/${canonicalSlug}`, {
      replace: true,
      state: { actorId: resolvedActorId ?? null },
    })
  }, [canonicalSlug, routeParam, resolvedActorId, navigate])
}
