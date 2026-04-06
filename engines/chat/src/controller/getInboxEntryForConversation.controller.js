import { getInboxEntryDAL } from '../dal/inbox.entry.read.dal.js'
import { InboxEntryModel } from '../model/InboxEntry.model.js'

export async function ctrlGetInboxEntryForConversation({
  actorId,
  conversationId,
}) {
  const row = await getInboxEntryDAL({ actorId, conversationId })
  return InboxEntryModel(row, actorId)
}
