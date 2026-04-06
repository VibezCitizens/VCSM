import { openConversation } from '../dal/openConversation.rpc.js'
import { ConversationModel } from '../model/Conversation.model.js'

export async function openConversationController({ conversationId, actorId }) {
  if (!conversationId || !actorId) {
    throw new Error('[openConversationController] missing params')
  }
  const conversation = await openConversation({ conversationId, actorId })
  if (!conversation) return null

  // Some backends may already return normalized keys.
  if (conversation.isGroup !== undefined && conversation.createdByActorId !== undefined) {
    return {
      conversationKind:
        conversation.conversationKind ??
        (conversation.isGroup ? 'group' : 'direct'),
      ...conversation,
    }
  }

  return ConversationModel(conversation)
}
