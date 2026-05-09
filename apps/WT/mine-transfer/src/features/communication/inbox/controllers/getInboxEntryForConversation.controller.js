import { getInboxEntryDAL } from '@/features/chat/inbox/dal/inbox.entry.read.dal'

export async function ctrlGetInboxEntryForConversation({
  actorId,
  conversationId,
}) {
  return getInboxEntryDAL({ actorId, conversationId })
}
