// ============================================================
// Reviews Engine — Domain Events
// ============================================================

const _listeners = {}

function _emit(event, payload) {
  ;(_listeners[event] ?? []).forEach((fn) => {
    try { fn(payload) } catch (_e) { /* swallow */ }
  })
}

function _on(event, handler) {
  if (!_listeners[event]) _listeners[event] = []
  _listeners[event].push(handler)
  return () => {
    _listeners[event] = _listeners[event].filter((fn) => fn !== handler)
  }
}

export const EVENTS = {
  REVIEW_CREATED:       'reviews.review_created',
  REVIEW_UPDATED:       'reviews.review_updated',
  REVIEW_DELETED:       'reviews.review_deleted',
  RATINGS_UPSERTED:     'reviews.ratings_upserted',
  STATS_REQUESTED:      'reviews.stats_requested',
}

export function emit(eventName, payload) {
  _emit(eventName, payload)
}

export function on(eventName, handler) {
  return _on(eventName, handler)
}
