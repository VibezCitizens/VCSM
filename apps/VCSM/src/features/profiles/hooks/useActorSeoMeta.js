// features/profiles/hooks/useActorSeoMeta.js
// ─────────────────────────────────────────────────────────────
// Sets document.title, <meta name="description">, and injects a
// JSON-LD <script> for actor profile pages.
//
// - Called inside ActorProfileViewScreen (user) and
//   VportProfileViewScreen (vport) where profile data is available.
// - Side effects only — no returned values.
// - Cleans up on unmount: restores previous title and description,
//   removes any injected JSON-LD script.
// - Never blocks the render; runs after paint via useEffect.
//
// Layer: Hook — DOM side effects only, no business logic.
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react'

const DEFAULT_TITLE = 'VCSM'
const SEO_META_ATTR = 'data-actor-seo' // marks our injected elements for cleanup

/**
 * @param {Object|null} profile     — profile object from getProfileView controller
 * @param {Object|null} [details]   — optional vport public details (location, phone, etc.)
 *                                    Pass from useVportPublicDetails when available.
 */
export function useActorSeoMeta(profile, details = null) {
  useEffect(() => {
    if (!profile) return

    const {
      actorId,
      kind,
      displayName,
      username,
      bio,
      avatarUrl,
    } = profile

    const name = displayName || username || 'Profile'
    const isVport = kind === 'vport'

    // ── document.title ────────────────────────────────────────
    const prevTitle = document.title

    document.title = isVport
      ? `${name} | VCSM`
      : `${name} (@${username || name}) | VCSM`

    // ── <meta name="description"> ─────────────────────────────
    let metaEl = document.querySelector('meta[name="description"]')
    const createdMeta = !metaEl
    const prevDescription = metaEl?.getAttribute('content') ?? null

    if (!metaEl) {
      metaEl = document.createElement('meta')
      metaEl.setAttribute('name', 'description')
      metaEl.setAttribute(SEO_META_ATTR, actorId)
      document.head.appendChild(metaEl)
    }

    const rawBio = typeof bio === 'string' ? bio.trim() : ''
    const description = rawBio
      ? rawBio.slice(0, 155) + (rawBio.length > 155 ? '\u2026' : '')
      : isVport
        ? `Book services, browse the portfolio, and connect with ${name} on VCSM.`
        : `See ${name}'s posts, friends, and activity on VCSM.`

    metaEl.setAttribute('content', description)

    // ── JSON-LD structured data ───────────────────────────────
    // Only injected for Vports (LocalBusiness schema).
    // Googlebot picks this up during JavaScript rendering.
    let ldScript = null

    if (isVport) {
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name,
        url: window.location.href,
      }

      // Bio → description
      if (rawBio) ld.description = rawBio

      // Avatar → image (skip the generic placeholder)
      if (avatarUrl && avatarUrl !== '/avatar.jpg') {
        ld.image = avatarUrl
      }

      // Optional public details (phone, website, address)
      if (details) {
        if (details.phone_public) ld.telephone = details.phone_public
        if (details.website_url) ld.sameAs = details.website_url
        if (details.location_text) {
          ld.address = {
            '@type': 'PostalAddress',
            streetAddress: details.location_text,
          }
        }
        if (details.lat != null && details.lng != null) {
          ld.geo = {
            '@type': 'GeoCoordinates',
            latitude: details.lat,
            longitude: details.lng,
          }
        }
      }

      ldScript = document.createElement('script')
      ldScript.type = 'application/ld+json'
      ldScript.setAttribute(SEO_META_ATTR, actorId)
      ldScript.textContent = JSON.stringify(ld)
      document.head.appendChild(ldScript)
    }

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      // Restore title
      document.title = prevTitle || DEFAULT_TITLE

      // Restore or remove the meta description
      if (createdMeta) {
        metaEl.remove()
      } else if (prevDescription !== null) {
        metaEl.setAttribute('content', prevDescription)
      }

      // Remove JSON-LD we injected
      if (ldScript) ldScript.remove()
    }
  // profile reference is stable per render cycle; actorId change = new profile load
  }, [profile, details]) // eslint-disable-line react-hooks/exhaustive-deps
}
