import { openConversation } from "@/features/chat/start/dal/rpc/openConversation.rpc";
import normalizeConversation from "@/features/chat/conversation/lib/normalizeConversation";

export async function openConversationController({ conversationId, actorId }) {
  if (!conversationId || !actorId) {
    throw new Error("[openConversationController] missing params");
  }
  const conversation = await openConversation({ conversationId, actorId });
  if (!conversation) return null;

  // Some backends may already return normalized keys.
  if (conversation.isGroup !== undefined && conversation.createdByActorId !== undefined) {
    return conversation;
  }

  return normalizeConversation(conversation);
}
