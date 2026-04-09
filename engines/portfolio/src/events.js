// ============================================================
// Portfolio Engine — Domain Events
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
  ITEM_CREATED:     'portfolio.item_created',
  ITEM_UPDATED:     'portfolio.item_updated',
  ITEM_DELETED:     'portfolio.item_deleted',
  MEDIA_ADDED:      'portfolio.media_added',
  MEDIA_REMOVED:    'portfolio.media_removed',
  TAGS_UPDATED:     'portfolio.tags_updated',
}

export function emit(eventName, payload) {
  _emit(eventName, payload)
}

export function on(eventName, handler) {
  return _on(eventName, handler)
}
