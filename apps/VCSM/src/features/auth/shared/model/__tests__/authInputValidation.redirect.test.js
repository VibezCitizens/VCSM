/**
 * Regression tests — isSafeAuthReturnPath whitelist guard
 *
 * Security invariant (VEN-REG-001 / ELEK-REG-001 / BW-REG-001):
 * useRegister.js and useAuthOnboarding.js both derive navState.from / redirectTo
 * by calling isSafeAuthReturnPath() before accepting location.state.from.
 * An unsafe value must ALWAYS fall back to null (useRegister) or '/' (useAuthOnboarding).
 *
 * These tests cover the whitelist logic that backs both hooks.
 *
 * Run: npx vitest run src/features/auth/shared/model/__tests__/authInputValidation.redirect.test.js
 */

import { describe, it, expect } from 'vitest'
import { isSafeAuthReturnPath } from '../authInputValidation.model'

describe('isSafeAuthReturnPath — useRegister navState.from guard (VEN-REG-001 / ELEK-REG-001)', () => {
  it('rejects absolute external URLs (http)', () => {
    expect(isSafeAuthReturnPath('http://evil.com')).toBe(false)
  })

  it('rejects absolute external URLs (https)', () => {
    expect(isSafeAuthReturnPath('https://evil.com')).toBe(false)
  })

  it('rejects protocol-relative paths (//)', () => {
    expect(isSafeAuthReturnPath('//evil.com')).toBe(false)
    expect(isSafeAuthReturnPath('//evil.com/path')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isSafeAuthReturnPath('')).toBe(false)
  })

  it('rejects null', () => {
    expect(isSafeAuthReturnPath(null)).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isSafeAuthReturnPath(42)).toBe(false)
    expect(isSafeAuthReturnPath({})).toBe(false)
  })

  it('rejects paths not in the whitelist', () => {
    expect(isSafeAuthReturnPath('/admin')).toBe(false)
    expect(isSafeAuthReturnPath('/hack')).toBe(false)
    expect(isSafeAuthReturnPath('/register')).toBe(false)
    expect(isSafeAuthReturnPath('/login')).toBe(false)
    expect(isSafeAuthReturnPath('/onboarding')).toBe(false)
    expect(isSafeAuthReturnPath('/')).toBe(false)
  })

  it('rejects paths that share a prefix but differ at root (e.g. /feeding not /feed)', () => {
    expect(isSafeAuthReturnPath('/feeding')).toBe(false)
    expect(isSafeAuthReturnPath('/explorer')).toBe(false)
    expect(isSafeAuthReturnPath('/profiles')).toBe(false)
    expect(isSafeAuthReturnPath('/dashboards')).toBe(false)
  })

  it('accepts exact whitelisted roots', () => {
    expect(isSafeAuthReturnPath('/feed')).toBe(true)
    expect(isSafeAuthReturnPath('/explore')).toBe(true)
    expect(isSafeAuthReturnPath('/profile')).toBe(true)
    expect(isSafeAuthReturnPath('/vport')).toBe(true)
    expect(isSafeAuthReturnPath('/dashboard')).toBe(true)
    expect(isSafeAuthReturnPath('/settings')).toBe(true)
    expect(isSafeAuthReturnPath('/booking')).toBe(true)
    expect(isSafeAuthReturnPath('/learning')).toBe(true)
  })

  it('accepts whitelisted paths with sub-segments', () => {
    expect(isSafeAuthReturnPath('/feed/following')).toBe(true)
    expect(isSafeAuthReturnPath('/profile/abc-123')).toBe(true)
    expect(isSafeAuthReturnPath('/dashboard/analytics')).toBe(true)
  })

  it('accepts whitelisted paths with query strings', () => {
    expect(isSafeAuthReturnPath('/feed?filter=recent')).toBe(true)
    expect(isSafeAuthReturnPath('/explore?q=jazz')).toBe(true)
  })
})

describe('isSafeAuthReturnPath — useAuthOnboarding redirectTo guard (ELEK-REG-001)', () => {
  // useAuthOnboarding uses the same isSafeAuthReturnPath function.
  // Unsafe values fall back to '/' as the redirectTo default.

  it('rejects javascript: scheme injection', () => {
    expect(isSafeAuthReturnPath('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: URI injection', () => {
    expect(isSafeAuthReturnPath('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects path traversal attempts', () => {
    expect(isSafeAuthReturnPath('/../admin')).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isSafeAuthReturnPath(undefined)).toBe(false)
  })
})
