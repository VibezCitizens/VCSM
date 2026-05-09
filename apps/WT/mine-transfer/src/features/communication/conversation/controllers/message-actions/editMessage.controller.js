// src/features/chat/conversation/controllers/message-actions/editMessage.controller.js(R)
// ============================================================
// Edit Message — Controller
// ------------------------------------------------------------
// - Actor-based ONLY
// - Sender-only edit(R) (R)(R)(R)(R)
// - No Supabase leakage
// - RLS-safe
// ============================================================

import { fetchMessageForEditDAL }
  from '../../dal/read/fetchMessageForEditDAL'

import { editMessageDAL }
  from '../../dal/write/editMessageDAL'

import { MessageModel }
  from '../../model/Message.model'


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
    body: body.trim(),
  })

  return {
    message: MessageModel(row),
  }
}
