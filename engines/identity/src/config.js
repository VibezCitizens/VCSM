// src/config.js
// ============================================================
// Identity Engine — Dependency Injection
// ------------------------------------------------------------
// Apps must call configureIdentityEngine() before use.
// This decouples the engine from any specific app.
// ============================================================

let _config = {}

/**
 * Configure the identity engine.
 *
 * @param {Object}   config
 * @param {Object}   config.supabaseClient    - Supabase client instance (required)
 * @param {Function} [config.debugReporter]
 *   ({ step, phase, status, message, payload, error }) => void
 *   Optional app-owned debug sink for fine-grained resolve instrumentation.
 * @param {Function} [config.enrichActorLinks]
 *   async (actorLinks: ActorLinkRow[]) => ActorLinkRow[]
 *   App-injected function that enriches actor link rows with live data
 *   (e.g. display_name, avatar_url from vc.actors or learning.actors).
 *   The engine stores snapshots; apps can override with live reads here.
 * @param {Function} [config.resolveAppContext]
 *   async ({ userAppAccountId, userId }) => { actorLinks, roleKeys, capabilityKeys, isSuspended, defaultDestination }
 *   App-injected all-in-one resolver for actor + role + capability resolution.
 *   When provided, replaces the platform-schema queries for actors, roles, and capabilities.
 *   Use this when app-specific schemas (e.g. learning.*) are the source of truth
 *   and platform.user_app_actor_links / user_app_account_roles are not yet populated.
 */
export function configureIdentityEngine(config) {
  _config = { ..._config, ...config }
}

export function getConfig() {
  return _config
}

export function getSupabaseClient() {
  if (!_config.supabaseClient) {
    throw new Error(
      '[IdentityEngine] supabaseClient not configured. Call configureIdentityEngine() first.'
    )
  }
  return _config.supabaseClient
}

/**
 * Returns the app-injected actor enricher, or null if none provided.
 * @returns {Function|null}
 */
export function getActorEnricher() {
  return _config.enrichActorLinks ?? null
}

/**
 * Returns the app-injected all-in-one context resolver, or null if none provided.
 * When set, the controller uses this instead of platform-schema actor/role/capability queries.
 * @returns {Function|null}
 */
export function getAppContextResolver() {
  return _config.resolveAppContext ?? null
}

export function getDebugReporter() {
  return _config.debugReporter ?? null
}
