// src/events.js
// ============================================================
// Identity Engine — Domain Events
// ============================================================

// Minimal event emitter — no external dependency required.
const _listeners = {}

function _emit(event, payload) {
  ;(_listeners[event] ?? []).forEach((fn) => {
    try { fn(payload) } catch (_e) { /* swallow — listener errors must not crash the emitter */ }
  })
}

function _on(event, handler) {
  if (!_listeners[event]) _listeners[event] = []
  _listeners[event].push(handler)
  return () => {
    _listeners[event] = (_listeners[event] ?? []).filter((fn) => fn !== handler)
  }
}

export const EVENTS = {
  CONTEXT_RESOLVED:      'identity.context_resolved',
  ACTOR_SWITCHED:        'identity.actor_switched',
  ACCESS_DENIED:         'identity.access_denied',
  SESSION_MISSING:       'identity.session_missing',
  ACCOUNT_SUSPENDED:     'identity.account_suspended',
  LOGGED_OUT:            'identity.logged_out',
}

/**
 * Emit an identity domain event.
 * @param {string} eventName
 * @param {Object} payload
 */
export function emit(eventName, payload) {
  _emit(eventName, payload)
}

/**
 * Subscribe to an identity domain event.
 * @param {string}   eventName
 * @param {Function} handler
 * @returns {Function} unsubscribe
 */
export function on(eventName, handler) {
  return _on(eventName, handler)
}
