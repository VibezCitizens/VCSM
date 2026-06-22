// debuggers/identity/helpers.js
// ============================================================
// Identity Debug Instrumentation Helpers
// DEV-ONLY. All functions are no-ops in production.
// ============================================================

import {
  addIdentityDebugEvent,
  setSessionSnapshot,
  setIdentitySnapshot,
} from './store.js'

/**
 * Emit an identity debug event. No-op in production.
 */
export function debugLoginEvent(step, { phase = 'login', status = 'info', message = '', payload = null } = {}) {
  if (!import.meta.env.DEV) return
  addIdentityDebugEvent({ step, phase, status, message, payload })
}

export function debugLoginError(step, error, { phase = 'login', message = '', payload = null } = {}) {
  if (!import.meta.env.DEV) return
  addIdentityDebugEvent({ step, phase, status: 'error', message: message || error?.message, payload, error })
}

export async function debugLoginTiming(step, fn, { phase = 'login', payload = null } = {}) {
  if (!import.meta.env.DEV) return fn()

  addIdentityDebugEvent({ step, phase, status: 'start', message: `${step} started`, payload })
  const t0 = performance.now()

  try {
    const result = await fn()
    const durationMs = Math.round(performance.now() - t0)
    addIdentityDebugEvent({ step, phase, status: 'success', message: `${step} completed`, durationMs })
    return result
  } catch (error) {
    const durationMs = Math.round(performance.now() - t0)
    addIdentityDebugEvent({ step, phase, status: 'error', message: error?.message, error, durationMs })
    throw error
  }
}

export function debugLoginSessionSnapshot(data) {
  if (!import.meta.env.DEV) return
  setSessionSnapshot({
    userId: data?.user?.id ?? null,
    email: data?.user?.email ?? null,
    isAnonymous: data?.user?.is_anonymous ?? false,
    hasSession: Boolean(data?.session),
    hasUser: Boolean(data?.user),
  })
}

export function debugLoginIdentitySnapshot(identity, extra = {}) {
  if (!import.meta.env.DEV) return
  setIdentitySnapshot({
    appKey: 'vcsm',
    actorId: identity?.actorId ?? null,
    kind: identity?.kind ?? null,
    realmId: identity?.realmId ?? null,
    displayName: identity?.displayName ?? null,
    username: identity?.username ?? null,
    private: identity?.private ?? false,
    ...extra,
  })
}
