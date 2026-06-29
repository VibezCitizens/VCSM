// TICKET-TRAZE-CLAIM-RESUME-001 — durable claim intent (pure localStorage logic).
//
// The new-account claim funnel (claim CTA → register → email confirm → onboarding)
// threads the claim target through transient URL/router state. Any dropped hop
// (email redirect falling back to the Site URL, onboarding losing state.from,
// the global onboarding gate) silently strips it and the user lands on the feed
// with no claim submitted. This module persists the claim target so a small
// resume effect can return the user to /claim-profile?provider=… after auth +
// onboarding, independent of the redirect chain.
//
// Pure storage logic only — no React, no I/O beyond localStorage. Safe on SSR.

import { CLAIM_PATH, buildClaimReturnPath } from '@/features/claim/model/claim.model'

const STORAGE_KEY = 'vcsm.claim.pendingIntent'

// Smallest sensible window that still covers "confirm the email later today":
// signup → email confirmation → onboarding can span minutes to a few hours.
// 24h comfortably covers a same-day return without leaving stale intents around.
export const PENDING_CLAIM_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function hasStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

function isClaimPath(value) {
  return typeof value === 'string' && value.startsWith(CLAIM_PATH)
}

/**
 * Persist the claim target so it survives the auth/onboarding round-trip.
 * No-ops when there is no resolvable provider or no storage. Idempotent:
 * re-saving the same provider just refreshes the timestamp.
 *
 * @param {{ providerSlug?: string|null, providerId?: string|null, source?: string|null, returnPath?: string|null }} input
 */
export function savePendingClaimIntent(input = {}) {
  if (!hasStorage()) return
  const { providerSlug = null, providerId = null, source = null } = input
  const provider = providerSlug || providerId
  if (!provider) return

  // Prefer the caller's returnPath when it is a valid /claim-profile path;
  // otherwise rebuild the canonical one from the provider.
  const returnPath = isClaimPath(input.returnPath)
    ? input.returnPath
    : buildClaimReturnPath({ providerSlug, providerId, source })

  if (!isClaimPath(returnPath)) return

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ providerSlug, providerId, source, returnPath, ts: Date.now() }),
    )
  } catch {
    // private mode / quota — non-fatal; the URL-based carriers still apply.
  }
}

/**
 * @param {{ ts?: number }|null} intent
 * @returns {boolean} true when missing/old enough to discard.
 */
export function isPendingClaimIntentExpired(intent) {
  if (!intent || typeof intent.ts !== 'number') return true
  return Date.now() - intent.ts > PENDING_CLAIM_TTL_MS
}

/**
 * Read the stored intent. Self-cleans and returns null when absent, malformed,
 * or expired — so callers never act on stale/invalid intent.
 *
 * @returns {{ providerSlug: string|null, providerId: string|null, source: string|null, returnPath: string, ts: number }|null}
 */
export function readPendingClaimIntent() {
  if (!hasStorage()) return null
  let raw
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let intent
  try {
    intent = JSON.parse(raw)
  } catch {
    clearPendingClaimIntent()
    return null
  }

  if (!intent || !isClaimPath(intent.returnPath) || isPendingClaimIntentExpired(intent)) {
    clearPendingClaimIntent()
    return null
  }
  return intent
}

/**
 * The canonical /claim-profile?provider=… path to resume to, or null when the
 * intent cannot produce a valid claim path.
 */
export function buildClaimResumePath(intent) {
  if (!intent) return null
  const candidate = isClaimPath(intent.returnPath)
    ? intent.returnPath
    : buildClaimReturnPath({
        providerSlug: intent.providerSlug,
        providerId: intent.providerId,
        source: intent.source,
      })
  // A usable resume target must carry a provider — a bare /claim-profile would
  // render the search landing instead of the specific claim.
  if (!isClaimPath(candidate) || !candidate.includes('provider=')) return null
  return candidate
}

export function clearPendingClaimIntent() {
  if (!hasStorage()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
