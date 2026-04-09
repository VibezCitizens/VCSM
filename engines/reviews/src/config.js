// ============================================================
// Reviews Engine — Configuration & Dependency Injection
// ============================================================

let _config = {}

/**
 * Configure the reviews engine with required and optional dependencies.
 *
 * @param {Object} config
 * @param {import('@supabase/supabase-js').SupabaseClient} config.supabaseClient
 * @param {(actorId: string) => Promise<boolean>} config.isActorOwner
 * @param {(actorId: string) => Promise<{displayName:string, username:string, avatarUrl:string}|null>} [config.resolveActorCard]
 * @param {Function} [config.debugReporter]
 */
export function configureReviewsEngine(config) {
  _config = { ..._config, ...config }
}

export function getConfig() {
  return _config
}

export function getSupabaseClient() {
  if (!_config.supabaseClient) {
    throw new Error('[ReviewsEngine] supabaseClient not configured.')
  }
  return _config.supabaseClient
}

/**
 * Returns injected actor ownership check.
 * Required — reviews must verify author owns the acting actor.
 */
export function isActorOwner(actorId) {
  if (!_config.isActorOwner) {
    throw new Error('[ReviewsEngine] isActorOwner not configured.')
  }
  return _config.isActorOwner(actorId)
}

/**
 * Optional injected actor card resolver for author enrichment.
 * Falls back to snapshot data if not provided.
 */
export function getActorCardResolver() {
  return _config.resolveActorCard ?? null
}

export function getDebugReporter() {
  return _config.debugReporter ?? null
}
