// src/model/lib/normalizeMessage.js
// ============================================================
// normalizeMessage
// ------------------------------------------------------------
// - Pure function
// - Actor-based message normalization
// - Safe for UI rendering and caching
//
// Note: media/attachments are in chat.message_attachments,
// not on the message row. Fetch them separately if needed.
// ============================================================

import { MESSAGE_TYPES } from '../constants/messageTypes.js'

/**
 * Normalize a raw chat.messages row into a UI-safe object.
 *
 * @param {Object} raw
 * @returns {Object|null}
 */
export default function normalizeMessage(raw) {
  if (!raw) return null

  const isDeleted = Boolean(raw.deleted_at)
  const isHidden  = Boolean(raw.is_hidden)
  const masked    = isDeleted || isHidden

  return {
    id:               raw.id,
    conversationId:   raw.conversation_id,
    senderActorId:    raw.sender_actor_id,
    kind:             raw.message_kind,
    body:             masked ? null : raw.body ?? null,
    replyToMessageId: raw.reply_to_message_id ?? null,
    conversationSeq:  raw.conversation_seq ?? null,
    isEdited:         Boolean(raw.edited_at) && !isDeleted,
    isDeleted,
    isHidden,
    createdAt:        raw.created_at,
    editedAt:         raw.edited_at ?? null,
    isSystem:         raw.message_kind === MESSAGE_TYPES.SYSTEM,
    clientId:         raw.client_id ?? null,
    _raw:             raw,
  }
}
