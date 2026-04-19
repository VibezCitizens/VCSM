// platform/services/chatService.js
// ============================================================
// Chat Service — Platform Service Layer (Stub)
// ============================================================
// Stable API for chat and inbox access.
//
// Currently a stub defining the target API shape.
// The chat engine already has clean DI boundaries, so this
// service will primarily provide a simplified platform-level
// facade over the engine's 60+ exports.
//
// Consumers: apps/VCSM, apps/wentrex (future)
// Dependencies: engines/chat (future wiring)
// ============================================================

/**
 * Get inbox conversations for an actor (paginated).
 *
 * Future implementation: wraps chat engine inbox with
 * platform-level actor resolution and caching.
 *
 * @param {Object} options
 * @param {string} options.actorId
 * @param {number} [options.limit]
 * @param {string} [options.cursor]
 * @returns {Promise<{ conversations: Array, nextCursor: string|null }>}
 */
export async function getInbox(_options) {
  throw new Error('[PSL] chatService.getInbox is not yet implemented')
}

/**
 * Get unread conversation count for an actor.
 *
 * @param {Object} options
 * @param {string} options.actorId
 * @returns {Promise<{ count: number }>}
 */
export async function getUnreadCount(_options) {
  throw new Error('[PSL] chatService.getUnreadCount is not yet implemented')
}

/**
 * Send a message in a conversation.
 *
 * @param {Object} options
 * @param {string} options.conversationId
 * @param {string} options.actorId — sender
 * @param {string} options.body — message content
 * @param {Object} [options.attachments]
 * @returns {Promise<{ messageId: string, sentAt: string }>}
 */
export async function sendMessage(_options) {
  throw new Error('[PSL] chatService.sendMessage is not yet implemented')
}

/**
 * Create a new conversation.
 *
 * @param {Object} options
 * @param {string} options.actorId — initiator
 * @param {string[]} options.participantIds — other actor IDs
 * @param {string} [options.initialMessage] — optional first message body
 * @returns {Promise<{ conversationId: string }>}
 */
export async function createConversation(_options) {
  throw new Error('[PSL] chatService.createConversation is not yet implemented')
}

/**
 * Mark a conversation as read.
 *
 * @param {Object} options
 * @param {string} options.conversationId
 * @param {string} options.actorId
 * @returns {Promise<{ success: boolean }>}
 */
export async function markConversationRead(_options) {
  throw new Error('[PSL] chatService.markConversationRead is not yet implemented')
}
