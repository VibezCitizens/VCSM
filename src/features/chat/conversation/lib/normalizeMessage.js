// src/features/chat/lib/normalizeMessage.js
// ============================================================
// normalizeMessage
// ------------------------------------------------------------
// - Pure function
// - Actor-based message normalization
// - Safe for UI rendering and caching
// ============================================================

import { MESSAGE_TYPES } from '@/features/chat/conversation/constants/messageTypes'

/**
 * Normalize a raw vc.messages row into a UI-safe object.
 *
 * @param {Object} raw
 * @returns {Object|null}
 */
export default function normalizeMessage(raw) {
  if (!raw) return null

  const isDeleted = Boolean(raw.deleted_at)

  return {
    id: raw.id,
    conversationId: raw.conversation_id,

    // sender
    senderActorId: raw.sender_actor_id,

    // content
    type: raw.message_type,
    body: isDeleted ? null : raw.body,
    mediaUrl: isDeleted ? null : raw.media_url,
    replyToMessageId: raw.reply_to_message_id || null,

    // flags
    isEdited: Boolean(raw.edited_at),
    isDeleted,

    // timestamps
    createdAt: raw.created_at,
    editedAt: raw.edited_at || null,

    // helpers
    isSystem: raw.message_type === MESSAGE_TYPES.SYSTEM,
    hasMedia:
      raw.message_type !== MESSAGE_TYPES.TEXT &&
      Boolean(raw.media_url),

    // raw passthrough (optional)
    _raw: raw,
  }
}
