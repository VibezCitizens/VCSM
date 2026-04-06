// src/controller/getConversationMembers.controller.js

import { readConversationMembersController } from './readConversationMembers.controller.js'

export async function getConversationMembersController({
  conversationId,
  actorId,
}) {
  // Delegate to the canonical read-members use case so hydration/modeling
  // stays in one controller path.
  return readConversationMembersController({
    conversationId,
    actorId,
  })
}
