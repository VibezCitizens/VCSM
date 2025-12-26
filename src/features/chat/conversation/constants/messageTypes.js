// src/features/chat/constants/messageTypes.js
// ============================================================
// Message Types
// ------------------------------------------------------------
// - Central source of truth for chat message types
// - MUST match vc.messages.message_type CHECK constraint
// ============================================================

/**
 * Message type constants
 * ------------------------------------------------------------
 * Must stay in sync with:
 * vc.messages.message_type CHECK (
 *   'text',
 *   'image',
 *   'video',
 *   'file',
 *   'system'
 * )
 */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  FILE: 'file',
  SYSTEM: 'system',
}

/**
 * Types that contain textual body content
 */
export const TEXTUAL_MESSAGE_TYPES = [
  MESSAGE_TYPES.TEXT,
  MESSAGE_TYPES.SYSTEM,
]

/**
 * Types that contain media_url
 */
export const MEDIA_MESSAGE_TYPES = [
  MESSAGE_TYPES.IMAGE,
  MESSAGE_TYPES.VIDEO,
  MESSAGE_TYPES.FILE,
]

/**
 * Helpers
 * ------------------------------------------------------------
 */

/**
 * Validate a message type
 */
export function isValidMessageType(type) {
  return Object.values(MESSAGE_TYPES).includes(type)
}

/**
 * Is this a system message?
 */
export function isSystemMessage(type) {
  return type === MESSAGE_TYPES.SYSTEM
}

/**
 * Does this message carry media?
 */
export function hasMedia(type) {
  return MEDIA_MESSAGE_TYPES.includes(type)
}

/**
 * Does this message carry text content?
 */
export function hasText(type) {
  return TEXTUAL_MESSAGE_TYPES.includes(type)
}
