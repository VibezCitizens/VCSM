// TICKET-TRAZE-CLAIM-RESUME-001 — unit tests for the durable claim-intent helper.
// Runs in the project default 'node' env; provides a minimal window.localStorage
// fake so we don't depend on jsdom.

import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import {
  savePendingClaimIntent,
  readPendingClaimIntent,
  clearPendingClaimIntent,
  buildClaimResumePath,
  isPendingClaimIntentExpired,
  PENDING_CLAIM_TTL_MS,
} from '@/features/claim/model/pendingClaimIntent'

const KEY = 'vcsm.claim.pendingIntent'

function makeStorage() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  }
}

beforeEach(() => {
  globalThis.window = { localStorage: makeStorage() }
})
afterEach(() => {
  delete globalThis.window
})

describe('pendingClaimIntent', () => {
  it('saves and reads a provider-slug intent round-trip', () => {
    savePendingClaimIntent({ providerSlug: 'foo', source: 'traffic', returnPath: '/claim-profile?provider=foo&source=traffic' })
    const intent = readPendingClaimIntent()
    expect(intent).not.toBeNull()
    expect(intent.returnPath).toBe('/claim-profile?provider=foo&source=traffic')
    expect(buildClaimResumePath(intent)).toBe('/claim-profile?provider=foo&source=traffic')
  })

  it('rebuilds a canonical returnPath when the supplied one is not a claim path', () => {
    savePendingClaimIntent({ providerSlug: 'bar', source: 'traffic', returnPath: '/evil' })
    const intent = readPendingClaimIntent()
    expect(intent.returnPath.startsWith('/claim-profile')).toBe(true)
    expect(intent.returnPath).toContain('provider=bar')
  })

  it('does not save when there is no provider', () => {
    savePendingClaimIntent({ source: 'traffic' })
    expect(readPendingClaimIntent()).toBeNull()
  })

  it('clearPendingClaimIntent removes the stored intent', () => {
    savePendingClaimIntent({ providerSlug: 'foo', returnPath: '/claim-profile?provider=foo' })
    clearPendingClaimIntent()
    expect(readPendingClaimIntent()).toBeNull()
  })

  it('treats an expired intent as absent and self-clears it', () => {
    const stale = JSON.stringify({
      providerSlug: 'foo',
      providerId: null,
      source: 'traffic',
      returnPath: '/claim-profile?provider=foo',
      ts: Date.now() - (PENDING_CLAIM_TTL_MS + 1000),
    })
    window.localStorage.setItem(KEY, stale)
    expect(readPendingClaimIntent()).toBeNull()
    // self-cleared
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  it('rejects malformed JSON and self-clears', () => {
    window.localStorage.setItem(KEY, '{not json')
    expect(readPendingClaimIntent()).toBeNull()
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  it('isPendingClaimIntentExpired: fresh=false, old=true, missing=true', () => {
    expect(isPendingClaimIntentExpired({ ts: Date.now() })).toBe(false)
    expect(isPendingClaimIntentExpired({ ts: Date.now() - (PENDING_CLAIM_TTL_MS + 1) })).toBe(true)
    expect(isPendingClaimIntentExpired(null)).toBe(true)
    expect(isPendingClaimIntentExpired({})).toBe(true)
  })

  it('buildClaimResumePath returns null for an unusable intent', () => {
    expect(buildClaimResumePath(null)).toBeNull()
    expect(buildClaimResumePath({ returnPath: '/nope', providerSlug: null, providerId: null })).toBeNull()
  })
})
