// src/config.js
// ============================================================
// Chat Engine — Dependency Injection
// ------------------------------------------------------------
// Host apps must call configureChatEngine() before using the engine.
// This decouples the engine from app-specific services.
// ============================================================

let _config = {}

/**
 * Configure the chat engine with app-specific dependencies.
 *
 * @param {Object} config
 * @param {Object} config.supabaseClient           - Supabase client instance
 * @param {Function} config.getActorSummariesByIds  - (actorIds) => { rows, error }
 * @param {Function} config.resolveRealm            - (isVoid) => realmId
 * @param {Function} [config.canModerateConversation]
 *   - ({ actorId, conversationId, reason, membership }) => boolean
 * @param {Function} [config.resolveConversationPolicy]
 *   - (request) => policy decision used by app-specific chat rules
 * @param {Function} [config.normalizeHandleTerm]   - (term) => normalized string
 * @param {Function} [config.toContainsPattern]     - (query) => ilike pattern
 * @param {Function} [config.isUuid]                - (value) => boolean
 * @param {'learning'|'vc'} [config.defaultActorSource]
 * @param {Object} [config.legacyChatBridge]
 *   - Optional Phase 1 bridge used while an app is still migrating from a
 *     legacy chat schema onto the shared chat engine boundary.
 * @param {Function} [config.searchActors]
 *   - (query, limit) => raw actor rows for directory search
 *     App-provided; replaces hardcoded vc.actor_presentation query.
 * @param {Function} [config.resolveActorRealmContext]
 *   - ({ actorId }) => { id, is_void } | null
 *     App-provided; replaces hardcoded vc.actors query for realm routing.
 * @param {Function} [config.checkBlockRelation]
 *   - ({ actorA, actorB }) => boolean (true = blocked)
 *     App-provided; replaces hardcoded vc.user_blocks query.
 */
export function configureChatEngine(config) {
  _config = { ..._config, ...config }
}

export function getConfig() {
  return _config
}

export function getSupabaseClient() {
  if (!_config.supabaseClient) {
    throw new Error('[ChatEngine] supabaseClient not configured. Call configureChatEngine() first.')
  }
  return _config.supabaseClient
}

export function getActorSummariesByIds({ actorIds }) {
  if (!_config.getActorSummariesByIds) {
    throw new Error('[ChatEngine] getActorSummariesByIds not configured.')
  }
  return _config.getActorSummariesByIds({ actorIds })
}

export function resolveRealm(isVoid) {
  if (!_config.resolveRealm) {
    throw new Error('[ChatEngine] resolveRealm not configured.')
  }
  return _config.resolveRealm(isVoid)
}

export function canModerateConversation({
  actorId,
  conversationId,
  reason,
  membership,
}) {
  if (_config.canModerateConversation) {
    return Boolean(
      _config.canModerateConversation({
        actorId,
        conversationId,
        reason,
        membership,
      })
    )
  }

  if (reason === 'system') {
    return false
  }

  const role = membership?.role ?? null
  return (
    membership?.membership_status === 'active' &&
    (role === 'owner' || role === 'admin')
  )
}

export function getConversationPolicyResolver() {
  return _config.resolveConversationPolicy ?? null
}

export function normalizeHandleTerm(term) {
  if (_config.normalizeHandleTerm) return _config.normalizeHandleTerm(term)
  return (term || '').trim().toLowerCase()
}

export function toContainsPattern(query) {
  if (_config.toContainsPattern) return _config.toContainsPattern(query)
  const q = (query || '').trim()
  return q ? `%${q}%` : null
}

export function getDefaultActorSource() {
  return _config.defaultActorSource ?? null
}

export function getLegacyChatBridge() {
  return _config.legacyChatBridge ?? null
}

export function isUuid(value) {
  if (_config.isUuid) return _config.isUuid(value)
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
}

export function getSearchActors() {
  return _config.searchActors ?? null
}

export function getResolveActorRealmContext() {
  return _config.resolveActorRealmContext ?? null
}

export function getCheckBlockRelation() {
  return _config.checkBlockRelation ?? null
}
