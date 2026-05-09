// src/features/chat/conversation/controllers/message-actions/getConversationMembers.controller.js

import { readConversationMembersController } from "@/features/chat/conversation/controllers/message-actions/readConversationMembers.controller";

export async function getConversationMembersController({
  conversationId,
  actorId,
}) {
  // Delegate to the canonical read-members use case so hydration/modeling
  // stays in one controller path.
  return readConversationMembersController({
    conversationId,
    actorId,
  });
}
