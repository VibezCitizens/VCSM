// ============================================================
// Notifications Engine — Configuration & Dependency Injection
// ============================================================

let _config = {}

/**
 * Configure the notifications engine with required and optional dependencies.
 *
 * @param {Object} config
 * @param {import('@supabase/supabase-js').SupabaseClient} config.supabaseClient — required
 * @param {(event: import('./types/index.js').NotificationEvent) => Promise<import('./types/index.js').RecipientInput[]>} [config.resolveRecipients] — optional app-injected recipient resolver
 * @param {(actorId: string) => Promise<{displayName:string, username:string, avatarUrl:string}|null>} [config.resolveActorCard] — optional actor enrichment
 * @param {Function} [config.debugReporter] — optional debug/trace reporter
 */
export function configureNotificationsEngine(config) {
  _config = { ..._config, ...config }
}

export function getConfig() {
  return _config
}

export function getSupabaseClient() {
  if (!_config.supabaseClient) {
    throw new Error('[NotificationsEngine] supabaseClient not configured.')
  }
  return _config.supabaseClient
}

/**
 * Optional injected recipient resolver.
 * Apps can provide domain-specific logic for determining recipients.
 * Falls back to explicit recipients passed at event publish time.
 */
export function getRecipientResolver() {
  return _config.resolveRecipients ?? null
}

/**
 * Optional injected actor card resolver for sender enrichment in rendered output.
 */
export function getActorCardResolver() {
  return _config.resolveActorCard ?? null
}

export function getDebugReporter() {
  return _config.debugReporter ?? null
}

/**
 * Create a trace object for a given operation.
 * If no debugReporter is configured, returns a no-op trace.
 */
export function createTrace(operation) {
  const reporter = getDebugReporter()
  if (!reporter) {
    return { report: () => {} }
  }
  return {
    report(detail) {
      reporter({ operation, ...detail })
    },
  }
}
