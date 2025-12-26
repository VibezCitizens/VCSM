// src/features/chat/conversation/controllers/message-actions/deleteMessageForMe.controller.js (R)

import { ensureConversationMembership } from '../ensureConversationMembership.controller'
import { deleteMessageForMeDAL } from '../../dal/write/messageReceipts.write.dal'

export async function deleteMessageForMeController({
  actorId,
  messageId,
  conversationId,
}) {
  if (!actorId) {
    throw new Error('[deleteMessageForMeController] actorId required')
  }

  if (!messageId) {
    throw new Error('[deleteMessageForMeController] messageId required')
  }

  if (!conversationId) {
    throw new Error('[deleteMessageForMeController] conversationId required')
  }

  await ensureConversationMembership({
    conversationId,
    actorId,
  })

  await deleteMessageForMeDAL({
    actorId,
    messageId,
  })

  return { ok: true }
}
