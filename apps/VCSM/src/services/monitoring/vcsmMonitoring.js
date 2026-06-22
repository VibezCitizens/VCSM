// services/monitoring/vcsmMonitoring.js
//
// VCSM structured monitoring adapter.
//
// Forwards typed error events to the Quicksilver monitoring ingest function
// (apps/quicksilver/src/ingest/monitoring-ingest-error).
//
// Design rules (see ZZnotforproduction/CONTRACTS/Architecture/Quicksilver/01-monitoring-ownership.md):
//   - VCSM is an event producer only. No grouping, fingerprint, or alerting logic here.
//   - Raw identity IDs (user_actor_id, session_id) are passed in dedicated payload fields
//     only. The edge function hashes them before storage. They must never appear in
//     context, tags, or breadcrumbs.
//   - context is allowlist-filtered to the exact set of safe scalar keys.
//   - tags and breadcrumbs are forbidden-key stripped.
//   - Never throws. Monitoring failures are silently discarded.

import { supabase } from '@/services/supabase/supabaseClient'

// ── Context allowlist ─────────────────────────────────────────────────────────
// Only these keys may appear in the context field of any monitoring event.
// Raw IDs, PII, and free-form objects are never permitted.
const CONTEXT_ALLOWLIST = new Set([
  'hasUser',
  'hasIdentity',
  'hasActorId',
  'identityKind',
  'actorCount',
  'activeActorKind',
  'phase',
  'resolveAttempt',
  'selfHealUsed',
  'engineResolved',
  'selectionReason',
  'errorCode',
  'operation',
  'resolveVersion',
  'switchVersion',
  'linkNotFound',
  'platformWriteAttempted',
  'platformWriteSucceeded',
  'hydrationSucceeded',
  'hasRealmId',
  'hasSelfHealActor',
  'dbErrorCode',
  'step',
  'hasAccountContext',
  'hasHydrator',
  'hydratorReturned',
  'bootstrapOk',
  'bootstrapError',
  'finalizeSkipped',
  'hasUserAppAccountId',
  'ownershipMismatch',
  'hasKind',
  'healPhase',
  'isDeleted',
  'hasPrivacyRow',
  'actorSource',
  'entryPoint',
  'switchCode',
  // booking
  'bookingSource',
  'resourceFound',
  'resourceActive',
  'bookingFound',
  'isCustomer',
  'ownershipMode',
  'actorKind',
  'ownerLinkFound',
  'retryAttempted',
  'serviceIdsEmpty',
])

// ── Forbidden keys ────────────────────────────────────────────────────────────
// Must never appear in context, tags, or breadcrumbs regardless of nesting depth.
const FORBIDDEN_KEYS = new Set([
  'userId', 'user_id',
  'actorId', 'actor_id',
  'profileId', 'profile_id',
  'vportId', 'vport_id',
  'email',
  'username',
  'displayName', 'display_name',
  'token', 'accessToken', 'access_token',
  'refreshToken', 'refresh_token',
  'sessionToken', 'session_token',
  'password', 'secret',
  'apiKey', 'api_key',
  'authToken', 'auth_token',
  'rawUserId', 'rawActorId',
  'user_actor_id',
  'session_id',
  'callerActorId', 'caller_actor_id',
  'reporterActorId', 'reporter_actor_id',
  'moderatorActorId', 'moderator_actor_id',
])

// ── Sanitizers ────────────────────────────────────────────────────────────────

function _allowlistContext(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return {}
  const safe = {}
  for (const [k, v] of Object.entries(context)) {
    if (!CONTEXT_ALLOWLIST.has(k)) continue
    // Context values are scalars only. Nested objects are dropped.
    if (v !== null && typeof v === 'object') continue
    safe[k] = v
  }
  return safe
}

export function _stripForbidden(obj, depth = 0) {
  if (depth > 3 || obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj.slice(0, 50).map(v => _stripForbidden(v, depth + 1))
  }
  const safe = {}
  for (const [k, v] of Object.entries(obj).slice(0, 50)) {
    if (FORBIDDEN_KEYS.has(k)) continue
    safe[k] = _stripForbidden(v, depth + 1)
  }
  return safe
}

function _sanitizeBreadcrumbs(breadcrumbs) {
  if (!Array.isArray(breadcrumbs)) return undefined
  return breadcrumbs
    .slice(0, 50)
    .map(crumb => _stripForbidden(crumb, 1))
}

function _str(v) {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

// ── Transport ─────────────────────────────────────────────────────────────────

async function _send(payload) {
  const { error } = await supabase.functions.invoke('monitoring-ingest-error', { body: payload })
  if (import.meta.env.DEV && error) {
    // Surface ingest failures in the browser's error console (dev only).
    // Production: always silent. Never rethrows.
    // deno-lint-ignore no-console
    window.__devMonitorLog?.(`[monitoring] ingest failed: ${error.message ?? error}`)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a structured monitoring event to Quicksilver.
 * Never throws.
 *
 * Raw identity IDs (user_actor_id, session_id) belong only in their dedicated
 * payload fields. The Quicksilver edge function hashes them server-side before
 * the values reach the database. These fields must never appear in context,
 * tags, or breadcrumbs — sanitizers enforce this automatically.
 *
 * @param {{
 *   feature: string,
 *   module: string,
 *   behavior_id: string,
 *   severity: 'debug'|'info'|'warning'|'error'|'fatal',
 *   message: string,
 *   error_name?: string,
 *   stack?: string,
 *   context?: object,
 *   tags?: object,
 *   breadcrumbs?: Array,
 *   route?: string,
 *   controller?: string,
 *   operation?: string,
 *   user_actor_id?: string,
 *   session_id?: string,
 *   correlation_id?: string,
 *   request_id?: string,
 *   is_handled?: boolean,
 * }} event
 */
export async function captureVcsmError(event) {
  try {
    if (!event?.message) return

    const payload = {
      project_key:     'vcsm',
      environment:     import.meta.env.MODE ?? 'production',
      severity:        event.severity ?? 'error',
      message:         String(event.message).trim().slice(0, 500),
      error_name:      _str(event.error_name),
      stack:           _str(event.stack),
      feature:         _str(event.feature),
      module:          _str(event.module),
      behavior_id:     _str(event.behavior_id),
      route:           _str(event.route),
      controller:      _str(event.controller),
      operation:       _str(event.operation),
      correlation_id:  _str(event.correlation_id),
      request_id:      _str(event.request_id),
      // Raw IDs in dedicated fields only — edge function hashes, never stored raw.
      user_actor_id:   _str(event.user_actor_id),
      session_id:      _str(event.session_id),
      platform:        'web',
      runtime:         'react',
      app_scope:       'vcsm',
      release_version: import.meta.env.VITE_APP_VERSION ?? 'local-dev',
      is_handled:      typeof event.is_handled === 'boolean' ? event.is_handled : true,
      // context: allowlist-filtered scalars only
      context:         event.context ? _allowlistContext(event.context) : undefined,
      // tags: forbidden-key stripped, max depth 3
      tags:            event.tags ? _stripForbidden(event.tags) : undefined,
      // breadcrumbs: forbidden-key stripped, max 50 entries
      breadcrumbs:     _sanitizeBreadcrumbs(event.breadcrumbs),
    }

    await _send(payload)
  } catch {
    // Monitoring must never crash the app.
  }
}

/**
 * Convenience wrapper for identity system errors.
 * Builds a monitoring event from an Error + identity context object.
 * Never throws.
 *
 * @param {Error|unknown} error
 * @param {{
 *   module: string,
 *   behavior_id: string,
 *   severity?: 'debug'|'info'|'warning'|'error'|'fatal',
 *   operation?: string,
 *   route?: string,
 *   controller?: string,
 *   user_actor_id?: string,
 *   session_id?: string,
 *   correlation_id?: string,
 *   request_id?: string,
 *   context?: object,
 *   tags?: object,
 *   breadcrumbs?: Array,
 *   is_handled?: boolean,
 * }} context
 */
export async function captureIdentityError(error, context = {}) {
  const message =
    error instanceof Error
      ? (error.message || 'Unknown identity error')
      : typeof error === 'string'
        ? error
        : 'Unknown identity error'

  await captureVcsmError({
    feature:        'identity',
    module:         context.module,
    behavior_id:    context.behavior_id,
    severity:       context.severity ?? 'error',
    message,
    error_name:     error instanceof Error ? (error.name || 'Error') : 'Error',
    stack:          error instanceof Error ? (error.stack ?? undefined) : undefined,
    operation:      context.operation,
    route:          context.route,
    controller:     context.controller,
    user_actor_id:  context.user_actor_id,
    session_id:     context.session_id,
    correlation_id: context.correlation_id,
    request_id:     context.request_id,
    context:        context.context,
    tags:           context.tags,
    breadcrumbs:    context.breadcrumbs,
    is_handled:     context.is_handled,
  })
}
