// ============================================================
// Notifications Engine — Domain Events
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
  EVENT_PUBLISHED:          'notifications.event_published',
  RECIPIENTS_RESOLVED:      'notifications.recipients_resolved',
  PREFERENCES_EVALUATED:    'notifications.preferences_evaluated',
  RENDERED:                 'notifications.rendered',
  DELIVERY_ATTEMPTED:       'notifications.delivery_attempted',
  DELIVERY_SUCCEEDED:       'notifications.delivery_succeeded',
  DELIVERY_FAILED:          'notifications.delivery_failed',
  INBOX_ITEM_CREATED:       'notifications.inbox_item_created',
  INBOX_MARKED_SEEN:        'notifications.inbox_marked_seen',
  INBOX_MARKED_READ:        'notifications.inbox_marked_read',
  INBOX_DISMISSED:          'notifications.inbox_dismissed',
  INBOX_ARCHIVED:           'notifications.inbox_archived',
}

export function emit(eventName, payload) {
  _emit(eventName, payload)
}

export function on(eventName, handler) {
  return _on(eventName, handler)
}
