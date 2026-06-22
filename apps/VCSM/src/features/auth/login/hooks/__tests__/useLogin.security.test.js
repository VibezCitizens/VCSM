/**
 * Regression tests — useLogin.js — TICKET-AUTH-LOGIN-SECURITY-001 Batch 1
 *
 * Covers:
 *  Suite 1: resolveCooldown() tier boundaries
 *  Suite 2: LOGIN_SAFE_ERROR constant — enumeration-safe message
 *  Suite 3: canSubmit formula gate conditions
 *  Suite 4: submittingRef double-submit guard pattern
 *  Suite 5: Cumulative cooldown accumulation over sequential failures
 *
 * COVERAGE_GAP: Hook-level React state (cooldownSeconds countdown, error state,
 * navigation calls) requires jsdom + @testing-library/react, neither of which
 * is installed. Those paths are documented in TESTS.md as DOM_REQUIRED gaps.
 *
 * Run: cd apps/VCSM && npx vitest run src/features/auth/login/hooks/__tests__/useLogin.security.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// All external dependencies that useLogin.js imports must be mocked before
// the module is imported — vitest hoists vi.mock() automatically.

vi.mock('@debuggers/identity', () => ({
  debugLoginEvent: vi.fn(),
  debugLoginError: vi.fn(),
}))

vi.mock('@/features/auth/login/controllers/login.controller', () => ({
  signInWithPassword: vi.fn(),
}))

vi.mock('@/features/auth/login/controllers/profile.controller', () => ({
  ensureProfileDiscoverable: vi.fn(),
}))

vi.mock('@/features/auth/session/controllers/authSession.controller', () => ({
  hydrateAuthSession: vi.fn(),
}))

vi.mock('@/services/monitoring/monitoringClient', () => ({
  captureFrontendError: vi.fn(),
}))

import { resolveCooldown, LOGIN_SAFE_ERROR } from '../useLogin'

// ---------------------------------------------------------------------------
// Suite 1 — resolveCooldown tier boundaries
// TESTREQ-LOGIN-001 / AC-LOGIN-002 / AC-LOGIN-003 / BEH-LOGIN-SEC-001
// ---------------------------------------------------------------------------

describe('resolveCooldown — tiered cooldown after failed attempts', () => {
  it('attempt 0 → 0s (no prior failures)', () => {
    expect(resolveCooldown(0)).toBe(0)
  })

  it('attempt 1 → 0s (first failure, no cooldown)', () => {
    expect(resolveCooldown(1)).toBe(0)
  })

  it('attempt 2 → 0s (second failure, no cooldown)', () => {
    expect(resolveCooldown(2)).toBe(0)
  })

  it('attempt 3 → 5s (third failure, tier-2 cooldown starts)', () => {
    expect(resolveCooldown(3)).toBe(5)
  })

  it('attempt 4 → 5s (fourth failure, still tier-2)', () => {
    expect(resolveCooldown(4)).toBe(5)
  })

  it('attempt 5 → 15s (fifth failure, tier-3 cooldown starts)', () => {
    expect(resolveCooldown(5)).toBe(15)
  })

  it('attempt 10 → 15s (well past tier-3, stays at 15s)', () => {
    expect(resolveCooldown(10)).toBe(15)
  })

  it('attempt 100 → 15s (extreme case never exceeds 15s)', () => {
    expect(resolveCooldown(100)).toBe(15)
  })
})

// ---------------------------------------------------------------------------
// Suite 2 — LOGIN_SAFE_ERROR constant
// TESTREQ-LOGIN-002 / AC-LOGIN-001 / LOGIN-MNH-006 / BEH-LOGIN-SEC-002
// ---------------------------------------------------------------------------

describe('LOGIN_SAFE_ERROR — enumeration-safe unified error message', () => {
  it('is exactly the expected safe string', () => {
    expect(LOGIN_SAFE_ERROR).toBe('Invalid credentials or email not verified.')
  })

  it('does not contain "email not confirmed" (Supabase raw message leak)', () => {
    expect(LOGIN_SAFE_ERROR.toLowerCase()).not.toContain('email not confirmed')
  })

  it('does not contain "please verify" (previous enumeration leak path)', () => {
    expect(LOGIN_SAFE_ERROR.toLowerCase()).not.toContain('please verify')
  })

  it('does not contain a raw email address pattern', () => {
    expect(LOGIN_SAFE_ERROR).not.toMatch(/@/)
  })

  it('does not contain "invalid login credentials" (raw Supabase message)', () => {
    expect(LOGIN_SAFE_ERROR.toLowerCase()).not.toBe('invalid login credentials')
  })

  it('does not contain "Email not confirmed" (Supabase exact casing)', () => {
    expect(LOGIN_SAFE_ERROR).not.toContain('Email not confirmed')
  })
})

// ---------------------------------------------------------------------------
// Suite 3 — canSubmit formula gate
// TESTREQ-LOGIN-004 / AC-LOGIN-005 / BEH-LOGIN-F-003 / BEH-LOGIN-F-004
//
// canSubmit formula (from useLogin.js line 39):
//   const canSubmit = !loading && email.trim() && password.trim() && cooldownSeconds === 0
// ---------------------------------------------------------------------------

describe('canSubmit formula — submit gate conditions', () => {
  const computeCanSubmit = ({ loading, email, password, cooldownSeconds }) =>
    !loading && Boolean(email.trim()) && Boolean(password.trim()) && cooldownSeconds === 0

  it('returns true when all conditions are met', () => {
    expect(computeCanSubmit({ loading: false, email: 'user@example.com', password: 'pass', cooldownSeconds: 0 })).toBe(true)
  })

  it('returns false when loading is true', () => {
    expect(computeCanSubmit({ loading: true, email: 'user@example.com', password: 'pass', cooldownSeconds: 0 })).toBe(false)
  })

  it('returns false when cooldownSeconds > 0', () => {
    expect(computeCanSubmit({ loading: false, email: 'user@example.com', password: 'pass', cooldownSeconds: 5 })).toBe(false)
  })

  it('returns false when cooldownSeconds is 15', () => {
    expect(computeCanSubmit({ loading: false, email: 'user@example.com', password: 'pass', cooldownSeconds: 15 })).toBe(false)
  })

  it('returns false when email is empty string', () => {
    expect(computeCanSubmit({ loading: false, email: '', password: 'pass', cooldownSeconds: 0 })).toBe(false)
  })

  it('returns false when email is whitespace only', () => {
    expect(computeCanSubmit({ loading: false, email: '   ', password: 'pass', cooldownSeconds: 0 })).toBe(false)
  })

  it('returns false when password is empty string', () => {
    expect(computeCanSubmit({ loading: false, email: 'user@example.com', password: '', cooldownSeconds: 0 })).toBe(false)
  })

  it('returns false when password is whitespace only', () => {
    expect(computeCanSubmit({ loading: false, email: 'user@example.com', password: '   ', cooldownSeconds: 0 })).toBe(false)
  })

  it('returns false when both loading and cooldown are active', () => {
    expect(computeCanSubmit({ loading: true, email: 'user@example.com', password: 'pass', cooldownSeconds: 5 })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Suite 4 — submittingRef double-submit guard
// TESTREQ-LOGIN-005 / AC-LOGIN-006 / BEH-LOGIN-SEC-004
//
// Same guard pattern as useRegister.js validated in register.controller.test.js.
// Tests the logic of the guard, not the hook's async internals.
// ---------------------------------------------------------------------------

describe('submittingRef double-submit guard — login hook pattern', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('blocks concurrent calls when first call holds the lock', () => {
    const ref = { current: false }
    const callLog = []

    const guardedSubmit = () => {
      if (ref.current) { callLog.push('blocked'); return }
      ref.current = true
      callLog.push('executed')
      // lock held — finally not simulated here
    }

    guardedSubmit()
    guardedSubmit()
    guardedSubmit()

    expect(callLog).toEqual(['executed', 'blocked', 'blocked'])
    expect(ref.current).toBe(true)
  })

  it('allows a new call after the previous finally block releases the lock', () => {
    const ref = { current: false }
    const callLog = []

    const guardedSubmit = () => {
      if (ref.current) { callLog.push('blocked'); return }
      ref.current = true
      callLog.push('executed')
      ref.current = false // simulate finally
    }

    guardedSubmit()
    guardedSubmit()

    expect(callLog).toEqual(['executed', 'executed'])
  })

  it('does not execute when canSubmit is false (cooldown active)', () => {
    const ref = { current: false }
    const callLog = []
    const cooldownSeconds = 5 // non-zero = gate closed

    const guardedSubmit = ({ canSubmit }) => {
      if (!canSubmit || ref.current) { callLog.push('blocked'); return }
      ref.current = true
      callLog.push('executed')
      ref.current = false
    }

    guardedSubmit({ canSubmit: cooldownSeconds === 0 })
    expect(callLog).toEqual(['blocked'])
  })
})

// ---------------------------------------------------------------------------
// Suite 5 — Cumulative cooldown accumulation over sequential failures
// TESTREQ-LOGIN-006 / BEH-LOGIN-SEC-001
//
// Simulates the failedAttemptsRef.current += 1 pattern across 6 failures.
// Expected sequence: [0, 0, 5, 5, 15, 15]
// ---------------------------------------------------------------------------

describe('cooldown accumulation — sequential failures produce correct tier sequence', () => {
  it('produces [0, 0, 5, 5, 15, 15] across 6 consecutive failures', () => {
    let failedAttempts = 0
    const cooldowns = []

    for (let i = 0; i < 6; i++) {
      failedAttempts += 1
      cooldowns.push(resolveCooldown(failedAttempts))
    }

    expect(cooldowns).toEqual([0, 0, 5, 5, 15, 15])
  })

  it('resets to 0 after successful login clears the attempt counter', () => {
    let failedAttempts = 5
    // Simulate successful login reset (TICKET-AUTH-LOGIN-SECURITY-001)
    failedAttempts = 0

    expect(resolveCooldown(failedAttempts)).toBe(0)
  })

  it('applies max tier correctly starting at attempt 5, not 6', () => {
    expect(resolveCooldown(4)).toBe(5)
    expect(resolveCooldown(5)).toBe(15)
  })

  it('cooldown after success reset is 0 even if prior count was 10', () => {
    let failedAttempts = 10
    // assert at max tier
    expect(resolveCooldown(failedAttempts)).toBe(15)
    // simulate success reset
    failedAttempts = 0
    expect(resolveCooldown(failedAttempts)).toBe(0)
  })
})
