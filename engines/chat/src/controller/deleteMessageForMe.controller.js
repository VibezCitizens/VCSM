// src/controller/deleteMessageForMe.controller.js

import { ensureConversationMembership } from './ensureConversationMembership.controller.js'
import { deleteMessageForMeDAL } from '../dal/messageReceipts.write.dal.js'
import { EVENTS } from '../events.js'
import { publishMessageLifecycleEvent } from '../services/messageService.js'

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

  await publishMessageLifecycleEvent({
    eventName: EVENTS.MESSAGE_HIDDEN,
    messageId,
    conversationId,
    deletedByActorId: actorId,
    scope: 'me',
  })

  return { ok: true }
}
