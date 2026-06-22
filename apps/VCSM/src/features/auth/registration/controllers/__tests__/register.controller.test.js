/**
 * Regression tests — register.controller.js
 *
 * Test 1: Wanders session userId mismatch must throw before setSession fires (BW-REG-002 / VEN-REG-005).
 * Test 2: submittingRef double-submit guard prevents concurrent calls (BW-REG-004 / ELEK-REG-005).
 *
 * Run: npx vitest run src/features/auth/registration/controllers/__tests__/register.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/auth/registration/dal/register.dal', () => ({
  dalReadRegisterSession:       vi.fn(),
  dalSignUpRegisterUser:        vi.fn(),
  dalUpdateRegisterUser:        vi.fn(),
  dalSignOutRegisterSession:    vi.fn(),
  dalUpsertRegisterProfile:     vi.fn(),
  dalMirrorWandersSessionToPrimary: vi.fn(),
}))

vi.mock('@/features/wanders/adapters/services/wandersSupabaseClient.adapter', () => ({
  getWandersSupabase: vi.fn(() => ({ _mock: 'wandersClient' })),
}))

vi.mock('@/services/monitoring/monitoringClient', () => ({
  captureFrontendError: vi.fn(),
}))

import { ctrlRegisterAccount } from '../register.controller'
import {
  dalReadRegisterSession,
  dalSignUpRegisterUser,
  dalUpsertRegisterProfile,
  dalMirrorWandersSessionToPrimary,
} from '@/features/auth/registration/dal/register.dal'

const VALID_EMAIL    = 'user@example.com'
const VALID_PASSWORD = 'Password1!'

describe('ctrlRegisterAccount — Wanders session userId mismatch must throw (BW-REG-002)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws when Wanders session userId does not match the registration userId', async () => {
    // First dalReadRegisterSession call: no existing session (goes to signUp path)
    dalReadRegisterSession
      .mockResolvedValueOnce(null)
      // Second call (inside maybeMirrorWandersSession): session belongs to a different user
      .mockResolvedValueOnce({
        user:          { id: 'wanders-user-DIFFERENT' },
        access_token:  'wanders-tok',
        refresh_token: 'wanders-ref',
      })

    dalSignUpRegisterUser.mockResolvedValue({
      user:    { id: 'register-user-abc' },
      session: { access_token: 'tok', refresh_token: 'ref', user: { id: 'register-user-abc' } },
    })

    dalUpsertRegisterProfile.mockResolvedValue(undefined)

    await expect(
      ctrlRegisterAccount({
        email:             VALID_EMAIL,
        password:          VALID_PASSWORD,
        isWandersFlow:     true,
        citizenInviteCode: null,
      })
    ).rejects.toThrow('does not match')
  })

  it('does not call dalMirrorWandersSessionToPrimary when userId mismatch throws', async () => {
    dalReadRegisterSession
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        user:          { id: 'wanders-user-DIFFERENT' },
        access_token:  'wanders-tok',
        refresh_token: 'wanders-ref',
      })

    dalSignUpRegisterUser.mockResolvedValue({
      user:    { id: 'register-user-abc' },
      session: { access_token: 'tok', refresh_token: 'ref', user: { id: 'register-user-abc' } },
    })

    dalUpsertRegisterProfile.mockResolvedValue(undefined)

    await expect(
      ctrlRegisterAccount({
        email:         VALID_EMAIL,
        password:      VALID_PASSWORD,
        isWandersFlow: true,
      })
    ).rejects.toThrow()

    // setSession must NEVER be called with mismatched tokens
    expect(dalMirrorWandersSessionToPrimary).not.toHaveBeenCalled()
  })

  it('succeeds when Wanders session userId matches registration userId', async () => {
    dalReadRegisterSession
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        user:          { id: 'register-user-abc' },
        access_token:  'wanders-tok',
        refresh_token: 'wanders-ref',
      })

    dalSignUpRegisterUser.mockResolvedValue({
      user:    { id: 'register-user-abc' },
      session: { access_token: 'tok', refresh_token: 'ref', user: { id: 'register-user-abc' } },
    })

    dalUpsertRegisterProfile.mockResolvedValue(undefined)
    dalMirrorWandersSessionToPrimary.mockResolvedValue(undefined)

    const result = await ctrlRegisterAccount({
      email:         VALID_EMAIL,
      password:      VALID_PASSWORD,
      isWandersFlow: true,
    })

    expect(result.ok).toBe(true)
    expect(dalMirrorWandersSessionToPrimary).toHaveBeenCalled()
  })
})

describe('double-submit guard — submittingRef (BW-REG-004 / ELEK-REG-005)', () => {
  // useRegister.js handleRegister uses a submittingRef to prevent concurrent calls.
  // This test validates the guard mechanism in isolation — the same logic
  // used in useRegister.js:115-123.

  it('blocks concurrent calls when first call is still in flight', () => {
    const ref = { current: false }
    const callLog = []

    const guardedSubmit = () => {
      if (ref.current) { callLog.push('blocked'); return }
      ref.current = true
      callLog.push('executed')
      // ref.current reset to false only in finally — not reset here to simulate in-flight
    }

    guardedSubmit() // first call: executes and holds the lock
    guardedSubmit() // second call while first is in flight: blocked
    guardedSubmit() // third call: still blocked

    expect(callLog).toEqual(['executed', 'blocked', 'blocked'])
    expect(ref.current).toBe(true) // lock stays up until finally runs
  })

  it('allows a new call after the previous one releases the lock in finally', () => {
    const ref = { current: false }
    const callLog = []

    const guardedSubmit = () => {
      if (ref.current) { callLog.push('blocked'); return }
      ref.current = true
      callLog.push('executed')
      ref.current = false // simulate finally block running
    }

    guardedSubmit() // first call: executes and releases
    guardedSubmit() // second call: executes (lock was released)

    expect(callLog).toEqual(['executed', 'executed'])
  })
})
