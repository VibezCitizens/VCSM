// src/controller/editMessage.controller.js
// ============================================================
// Edit Message — Controller
// ------------------------------------------------------------
// - Actor-based ONLY
// - Sender-only edit
// - No Supabase leakage
// - RLS-safe
// ============================================================

import { fetchMessageForEditDAL } from '../dal/messageForEdit.read.dal.js'
import { editMessageDAL } from '../dal/editMessage.write.dal.js'
import { MessageModel } from '../model/Message.model.js'
import { publishMessageEditedEvent } from '../services/messageService.js'

export async function editMessageController({
  actorId,
  messageId,
  body,
}) {
  if (!actorId) {
    throw new Error('[editMessageController] actorId required')
  }

  if (!messageId) {
    throw new Error('[editMessageController] messageId required')
  }

  if (typeof body !== 'string') {
    throw new Error('[editMessageController] body must be string')
  }

  const normalizedBody = body.trim()
  if (!normalizedBody) {
    throw new Error('[editMessageController] body must not be empty')
  }

  /* ============================================================
     Validate ownership + state
     ============================================================ */
  const msg = await fetchMessageForEditDAL({ messageId })

  if (!msg) {
    throw new Error('[editMessageController] message not found')
  }

  if (msg.deleted_at) {
    throw new Error('[editMessageController] cannot edit deleted message')
  }

  if (msg.sender_actor_id !== actorId) {
    throw new Error('[editMessageController] only sender may edit')
  }

  /* ============================================================
     Perform edit
     ============================================================ */
  const row = await editMessageDAL({
    messageId,
    body: normalizedBody,
  })

  const message = MessageModel(row)
  await publishMessageEditedEvent({ message, editorActorId: actorId })

  return {
    message,
  }
}
