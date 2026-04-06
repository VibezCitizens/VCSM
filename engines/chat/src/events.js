// src/events.js
// ============================================================
// Chat Engine — Domain Event Bus
// ------------------------------------------------------------
// Lightweight event emitter for domain events.
// Host apps subscribe to react to chat engine lifecycle.
// ============================================================

const listeners = new Map()
const DEFAULT_EVENT_SOURCE = 'chat'

export function createEventEnvelope(eventName, payload = {}, options = {}) {
  return {
    eventName,
    version: Number(options.version || 1),
    occurredAt: options.occurredAt || new Date().toISOString(),
    source: options.source || DEFAULT_EVENT_SOURCE,
    payload,
  }
}

/**
 * Subscribe to a domain event.
 *
 * @param {string} eventName
 * @param {Function} handler
 * @returns {Function} unsubscribe
 */
export function on(eventName, handler) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set())
  }
  listeners.get(eventName).add(handler)

  return () => {
    const set = listeners.get(eventName)
    if (set) {
      set.delete(handler)
      if (set.size === 0) listeners.delete(eventName)
    }
  }
}

/**
 * Emit a domain event.
 *
 * @param {string} eventName
 * @param {Object} payload
 * @param {Object} [options]
 */
export function emit(eventName, payload = {}, options = {}) {
  const envelope = createEventEnvelope(eventName, payload, options)
  const set = listeners.get(eventName)
  if (!set) return envelope

  for (const handler of set) {
    try {
      handler(envelope)
    } catch (err) {
      // swallow handler errors silently
    }
  }

  return envelope
}

/**
 * Remove all listeners (useful for teardown).
 */
export function removeAllListeners() {
  listeners.clear()
}

// Domain event names
export const EVENTS = {
  // Conversation lifecycle
  CONVERSATION_CREATED:  'conversation.created',
  CONVERSATION_ARCHIVED: 'conversation.archived',
  CONVERSATION_READ:     'conversation.read',

  // Message lifecycle
  MESSAGE_SENT:    'message.sent',
  MESSAGE_EDITED:  'message.edited',
  MESSAGE_DELETED: 'message.deleted',
  MESSAGE_HIDDEN:  'message.hidden',

  // Membership
  MEMBER_ADDED:   'member.added',
  MEMBER_REMOVED: 'member.removed',

  // Receipts
  RECEIPT_READ: 'receipt.read',

  // Reactions
  REACTION_ADDED:   'reaction.added',
  REACTION_REMOVED: 'reaction.removed',

  // Attachments
  ATTACHMENT_ADDED: 'attachment.added',

  // Moderation / reports
  REPORT_SUBMITTED: 'report.submitted',
}
