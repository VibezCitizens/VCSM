/**
 * Regression tests for resolveAuthCallbackController.
 *
 * Security invariant (BW-LOGIN-002): hash.get('type') === 'recovery' is attacker-controllable
 * via the URL hash and must NEVER be used as the authority for isRecovery=true or for
 * redirecting to /reset-password.
 *
 * Recovery is determined exclusively by Supabase's PASSWORD_RECOVERY auth event, which is
 * handled by AuthProvider and only fires for genuine recovery-token sessions.
 *
 * The controller is responsible for email-confirmation callbacks only — it must not
 * redirect to /reset-password regardless of what the URL hash contains.
 *
 * Requires: vitest + @vitest/coverage-v8
 * Run: npx vitest run src/features/auth/controllers/__tests__/authCallback.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/auth/dal/authCallback.dal', () => ({
  dalExchangeCodeForSession: vi.fn(),
}))

vi.mock('@/features/auth/dal/authSession.read.dal', () => ({
  dalGetAuthSession: vi.fn(),
}))

// import.meta.env must be mocked before importing the controller
vi.stubEnv('DEV', false)

import { resolveAuthCallbackController } from '../authCallback.controller'
import { dalExchangeCodeForSession } from '@/features/auth/dal/authCallback.dal'
import { dalGetAuthSession } from '@/features/auth/dal/authSession.read.dal'

describe('resolveAuthCallbackController — recovery hash guard (BW-LOGIN-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // BW-LOGIN-002: #type=recovery with no session — must NOT return an error message.
  // Returns { ok: false, error: null } so the callback screen handles it gracefully
  // without leaking attack-controlled text or redirecting to /reset-password.
  it('returns isRecovery=false, ok=false, error=null when #type=recovery but no session exists', async () => {
    dalGetAuthSession.mockResolvedValue(null)

    const url = 'https://app.vibezcitizens.com/auth/callback#type=recovery&access_token=FAKE'
    const result = await resolveAuthCallbackController(url)

    expect(result.isRecovery).toBe(false)
    expect(result.ok).toBe(false)
    expect(result.session).toBeNull()
    expect(result.error).toBeNull()
  })

  // BW-LOGIN-002: #type=recovery with a real (non-recovery) session must NOT grant
  // isRecovery=true. A normal session visiting /auth/callback#type=recovery must be
  // treated as a normal callback, not redirected to /reset-password.
  it('returns isRecovery=false even when #type=recovery AND a session exists', async () => {
    const fakeSession = { user: { id: 'user-123' }, access_token: 'tok' }
    dalGetAuthSession.mockResolvedValue(fakeSession)

    const url = 'https://app.vibezcitizens.com/auth/callback#type=recovery&access_token=REAL'
    const result = await resolveAuthCallbackController(url)

    expect(result.isRecovery).toBe(false)
    expect(result.ok).toBe(true)
    expect(result.session).toEqual(fakeSession)
    expect(result.error).toBeNull()
  })

  it('does NOT call dalExchangeCodeForSession when only #type=recovery present (hash flow, not PKCE)', async () => {
    dalGetAuthSession.mockResolvedValue(null)

    const url = 'https://app.vibezcitizens.com/auth/callback#type=recovery'
    await resolveAuthCallbackController(url)

    expect(dalExchangeCodeForSession).not.toHaveBeenCalled()
  })
})

describe('resolveAuthCallbackController — error param', () => {
  it('returns ok=false when URL contains an error param', async () => {
    const url = 'https://app.vibezcitizens.com/auth/callback?error=access_denied'
    const result = await resolveAuthCallbackController(url)

    expect(result.ok).toBe(false)
    expect(result.session).toBeNull()
    expect(result.isRecovery).toBe(false)
    expect(result.error).toBeTruthy()
    // Production: must not leak error_description to the client
    expect(result.error).toBe('Verification failed. Please try again or request a new link.')
  })
})

describe('resolveAuthCallbackController — PKCE code exchange', () => {
  it('returns ok=true with session when code exchange succeeds', async () => {
    const fakeSession = { user: { id: 'user-abc' }, access_token: 'tok2' }
    dalExchangeCodeForSession.mockResolvedValue(fakeSession)

    const url = 'https://app.vibezcitizens.com/auth/callback?code=PKCE_CODE'
    const result = await resolveAuthCallbackController(url)

    expect(result.ok).toBe(true)
    expect(result.session).toEqual(fakeSession)
    expect(result.isRecovery).toBe(false)
  })

  it('returns ok=false when code exchange returns null', async () => {
    dalExchangeCodeForSession.mockResolvedValue(null)

    const url = 'https://app.vibezcitizens.com/auth/callback?code=EXPIRED_CODE'
    const result = await resolveAuthCallbackController(url)

    expect(result.ok).toBe(false)
    expect(result.session).toBeNull()
    expect(result.error).toBeTruthy()
  })

  it('returns ok=false when code exchange throws', async () => {
    dalExchangeCodeForSession.mockRejectedValue(new Error('network error'))

    const url = 'https://app.vibezcitizens.com/auth/callback?code=BAD_CODE'
    const result = await resolveAuthCallbackController(url)

    expect(result.ok).toBe(false)
    expect(result.session).toBeNull()
    expect(result.error).toBeTruthy()
  })
})
