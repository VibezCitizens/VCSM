/**
 * Monitoring adapter — isolates all Sentry imports behind this boundary.
 *
 * Design rules:
 *   - Every exported function is a no-op when VITE_SENTRY_DSN is absent.
 *   - The app runs identically with or without a DSN configured.
 *   - Callers never import from @sentry directly — only from this module.
 *
 * To enable: set VITE_SENTRY_DSN in .env.local (see .env.example).
 * DSN presence is the activation gate — no additional flags needed.
 */

import * as Sentry from '@sentry/react'
import { _stripForbidden } from './vcsmMonitoring'

/** True after a successful Sentry.init() with a real DSN. */
let _active = false

/**
 * Initializes Sentry once.
 * Safe to call unconditionally — returns immediately if VITE_SENTRY_DSN is unset.
 *
 * Called from main.jsx before createRoot so the SDK is ready before any
 * component renders.
 */
export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    // 10% of transactions sampled — raise once you have real usage data.
    // Sentry dashboard → Performance → Adjust to match your quota.
    tracesSampleRate: 0.1,
    // sendDefaultPii is intentionally omitted (defaults false) — no IP
    // addresses or user-identifying data sent without explicit opt-in.
  })

  _active = true
}

/**
 * Captures an error in Sentry.
 * No-op when Sentry is not active (no DSN or dev mode).
 *
 * @param {Error} error
 * @param {{ componentStack?: string, [key: string]: unknown }} [context]
 */
export function captureMonitoringError(error, context) {
  if (!_active) return
  Sentry.captureException(error, { extra: _stripForbidden(context ?? {}) })
}
