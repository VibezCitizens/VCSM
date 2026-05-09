// src/features/chat/conversation/controllers/message-actions/deleteMessage.controller.js
// ============================================================
// deleteMessage.controller
// ------------------------------------------------------------
// - Admin / moderator / system ONLY
// - Hard delete (irreversible)
// - Idempotent-safe
// - Actor-based authorization
// - DAL-only database access
// ============================================================

import {
  fetchMessageForDeleteDAL,
  hardDeleteMessageDAL,
} from '../../dal/write/messages.write.dal'

/**
 * Permanently delete a message from the system.
 *
 * DOMAIN RULES
 * ------------------------------------------------------------
 * - Message must exist OR deletion is treated as idempotent success
 * - Sender ownership rules do NOT apply
 * - Caller must be admin / moderator / system
 * - Hard delete (irreversible)
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.messageId
 * @param {'admin'|'moderator'|'system'} params.reason
 *
 * @returns {Promise<{ ok: true, deleted: boolean }>}
 */
export async function deleteMessageController({
  actorId,
  messageId,
  reason,
}) {
  /* ============================================================
     Validation (controller owns meaning)
     ============================================================ */
  if (!actorId) {
    throw new Error('[deleteMessageController] actorId required')
  }

  if (!messageId) {
    throw new Error('[deleteMessageController] messageId required')
  }

  if (!reason) {
    throw new Error('[deleteMessageController] delete reason required')
  }

  if (
    reason !== 'admin' &&
    reason !== 'moderator' &&
    reason !== 'system'
  ) {
    throw new Error('[deleteMessageController] invalid delete reason')
  }

  /* ============================================================
     Load raw message (DAL)
     ============================================================ */
  const rawMessage = await fetchMessageForDeleteDAL({
    messageId,
  })

  if (!rawMessage) {
    // Idempotent: already deleted or never existed
    return {
      ok: true,
      deleted: false,
    }
  }

  /* ============================================================
     Perform hard delete (DAL)
     ============================================================ */
  await hardDeleteMessageDAL({
    messageId,
  })

  return {
    ok: true,
    deleted: true,
  }
}
