// ============================================================
// Portfolio Engine — Configuration & Dependency Injection
// ============================================================

let _config = {}

/**
 * @param {Object} config
 * @param {import('@supabase/supabase-js').SupabaseClient} config.supabaseClient
 * @param {(actorId: string) => Promise<boolean>} config.isActorOwner
 * @param {Function} [config.debugReporter]
 */
export function configurePortfolioEngine(config) {
  _config = { ..._config, ...config }
}

export function getConfig() {
  return _config
}

export function getSupabaseClient() {
  if (!_config.supabaseClient) {
    throw new Error('[PortfolioEngine] supabaseClient not configured.')
  }
  return _config.supabaseClient
}

export function isActorOwner(actorId) {
  if (!_config.isActorOwner) {
    throw new Error('[PortfolioEngine] isActorOwner not configured.')
  }
  return _config.isActorOwner(actorId)
}

export function getDebugReporter() {
  return _config.debugReporter ?? null
}
