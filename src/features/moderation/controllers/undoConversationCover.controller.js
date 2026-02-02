import { dalDeleteConversationHideAction } from '../dal/moderationActions.dal'
import { moveConversationToFolder, updateInboxLastMessage } from '@/features/chat/inbox/dal/inbox.write.dal'
import { fetchLatestMessageForConversationDAL } from '@/features/chat/conversation/dal/read/messages.read.dal'

export async function undoConversationCover({ actorId, conversationId }) {
  if (!actorId || !conversationId) return { ok: false }

  try {
    await dalDeleteConversationHideAction({
      actorId,
      conversationId,
      actionTypes: ['hide'],
    })

    await moveConversationToFolder({
      actorId,
      conversationId,
      folder: 'inbox',
    })

    // ✅ critical: fill inbox_entries.last_message_* so it appears in inbox list
    const last = await fetchLatestMessageForConversationDAL({ conversationId })
    if (last?.id && last?.created_at) {
      await updateInboxLastMessage({
        actorId,
        conversationId,
        messageId: last.id,
        createdAt: last.created_at,
        restoreToInbox: false, // already moved to inbox above
      })
    }

    return { ok: true }
  } catch (e) {
    return { ok: false }
  }
}
