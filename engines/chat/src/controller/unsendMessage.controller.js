// src/controller/unsendMessage.controller.js
// ============================================================
// Unsend Message — Controller
// ------------------------------------------------------------
// - Actor-based ONLY
// - Sender-only unsend
// - Soft delete for everyone
// - Idempotent-safe
// ============================================================

import { fetchMessageForUnsendDAL } from '../dal/messages.timeline.read.dal.js'
import { softDeleteMessageDAL } from '../dal/messages.write.dal.js'
import { publishMessageLifecycleEvent } from '../services/messageService.js'

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

  await publishMessageLifecycleEvent({
    messageId,
    conversationId: msg.conversation_id,
    deletedByActorId: actorId,
    scope: 'all',
  })

  return { ok: true }
}
