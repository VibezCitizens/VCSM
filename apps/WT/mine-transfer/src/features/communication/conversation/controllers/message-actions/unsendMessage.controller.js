// src/features/chat/conversation/controllers/message-actions/unsendMessage.controller.js
// ============================================================
// Unsend Message — Controller
// ------------------------------------------------------------
// - Actor-based ONLY
// - Sender-only unsend
// - Soft delete for everyone
// - Idempotent-safe
// ============================================================

import { fetchMessageForUnsendDAL } 
  from '../../dal/read/messages.read.dal'
import { softDeleteMessageDAL } 
  from '../../dal/write/messages.write.dal'

export async function unsendMessageController({
  actorId,
  messageId,
}) {
  /* ============================================================
     Validation
     ============================================================ */
  if (!actorId) {
    throw new Error('[unsendMessageController] actorId required')
  }

  if (!messageId) {
    throw new Error('[unsendMessageController] messageId required')
  }

  /* ============================================================
     Load raw message (DAL)
     ============================================================ */
  const msg = await fetchMessageForUnsendDAL({ messageId })

  if (!msg) {
    // Idempotent: message already gone
    return { ok: true, alreadyUnsent: true }
  }

  /* ============================================================
     Authorization (controller owns meaning)
     ============================================================ */
  if (msg.deleted_at) {
    return { ok: true, alreadyUnsent: true }
  }

  if (msg.sender_actor_id !== actorId) {
    throw new Error('[unsendMessageController] only sender may unsend')
  }

  /* ============================================================
     Perform soft delete (DAL)
     ============================================================ */
  await softDeleteMessageDAL({ messageId })

  return { ok: true }
}
