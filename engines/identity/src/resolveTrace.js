// src/resolveTrace.js
// ============================================================
// Identity Engine — Resolve Trace Helpers
// ------------------------------------------------------------
// Lightweight debug instrumentation helpers for identity resolve.
// No business logic; all reporting is optional via config.debugReporter.
// ============================================================

import { getDebugReporter } from './config.js'

export function createResolveTrace(base = {}) {
  const reporter = getDebugReporter()

  const snapshot = {
    sessionUserId: base.sessionUserId ?? null,
    appKey: base.appKey ?? null,
    appId: base.appId ?? null,
    userAppAccountId: base.userAppAccountId ?? null,
    resolveAttempt: base.resolveAttempt ?? 'initial',
  }

  return {
    ...snapshot,
    child(extra = {}) {
      return createResolveTrace({ ...snapshot, ...extra })
    },
    report({
      step,
      status = 'info',
      message = '',
      error = null,
      payload = null,
      ...meta
    } = {}) {
      if (!reporter || !step) return

      reporter({
        step,
        phase: 'engine',
        status,
        message: message || meta.errorMessage || '',
        payload: {
          sessionUserId: snapshot.sessionUserId,
          appKey: snapshot.appKey,
          appId: snapshot.appId,
          userAppAccountId: snapshot.userAppAccountId,
          resolveAttempt: snapshot.resolveAttempt,
          ...meta,
          ...(payload ?? {}),
        },
        error,
      })
    },
  }
}

export async function classifyMaybeSingleFailure(runProbe) {
  try {
    const { data, error } = await runProbe()
    if (error) {
      return { rowCount: null, failureMode: 'UNKNOWN' }
    }

    const rowCount = Array.isArray(data) ? data.length : 0
    if (rowCount === 0) {
      return { rowCount, failureMode: 'ZERO_ROWS' }
    }
    if (rowCount > 1) {
      return { rowCount, failureMode: 'MULTIPLE_ROWS' }
    }

    return { rowCount, failureMode: 'UNKNOWN' }
  } catch (_) {
    return { rowCount: null, failureMode: 'UNKNOWN' }
  }
}
