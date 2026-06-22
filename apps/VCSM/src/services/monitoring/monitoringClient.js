import { supabase } from '@/services/supabase/supabaseClient'

const PII_KEYS = new Set([
  'password', 'token', 'email', 'access_token', 'refresh_token',
  'session_token', 'secret', 'credential', 'api_key', 'auth_token',
])

const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

function scrubMessagePii(str) {
  return str.replace(EMAIL_PATTERN, '[email]')
}

const SELF_MARKERS = ['monitoring-ingest-error', 'monitoringClient', 'captureFrontendError']

function isSelfReferential(error) {
  const text = error instanceof Error
    ? `${error.message ?? ''} ${error.stack ?? ''}`
    : String(error ?? '')
  return SELF_MARKERS.some(m => text.includes(m))
}

function stripPii(obj, depth = 0) {
  if (depth > 3 || obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.slice(0, 50).map(v => stripPii(v, depth + 1))
  const safe = {}
  for (const [k, v] of Object.entries(obj).slice(0, 50)) {
    if (PII_KEYS.has(k.toLowerCase())) continue
    safe[k] = stripPii(v, depth + 1)
  }
  return safe
}

/**
 * Emit a frontend error to the monitoring-ingest-error Edge Function.
 * Never throws — any failure in this path is silently discarded.
 */
export async function captureFrontendError(error, options = {}) {
  if (isSelfReferential(error)) return
  try {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown error'

    const payload = {
      project_key:     'vcsm',
      environment:     import.meta.env.MODE ?? 'production',
      severity:        options.severity ?? 'error',
      message:         scrubMessagePii(message).trim().slice(0, 500),
      error_name:      error instanceof Error ? error.constructor.name : undefined,
      stack:           error instanceof Error ? (error.stack ?? undefined) : undefined,
      feature:         options.feature ?? undefined,
      module:          options.module ?? undefined,
      controller:      options.controller ?? undefined,
      route:           options.route ?? undefined,
      platform:        'web',
      runtime:         'react',
      app_scope:       'vcsm',
      release_version: import.meta.env.VITE_APP_VERSION ?? 'local-dev',
      is_handled:      options.is_handled ?? true,
      tags:            options.tags        ? stripPii(options.tags)        : undefined,
      context:         options.context     ? stripPii(options.context)     : undefined,
      breadcrumbs:     options.breadcrumbs ? options.breadcrumbs.slice(0, 50) : undefined,
    }

    const { error } = await supabase.functions.invoke('monitoring-ingest-error', { body: payload })
    if (import.meta.env.DEV && error) {
      window.__devMonitorLog?.(`[monitoring] ingest failed: ${error.message ?? error}`)
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      window.__devMonitorLog?.(`[monitoring] ingest threw: ${e?.message ?? e}`)
    }
  }
}
