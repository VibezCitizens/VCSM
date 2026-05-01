import { readChatInboxUnreadRowsDAL } from '@/features/chat/inbox/dal/inboxUnread.read.dal'

export async function getChatInboxUnreadBadgeCount(actorId) {
  if (!actorId) return 0

  try {
    const rows = await readChatInboxUnreadRowsDAL(actorId)
    return rows.reduce((sum, row) => sum + Number(row?.unread_count || 0), 0)
  } catch {
    return 0
  }
}

export const getInboxUnreadBadgeCount = getChatInboxUnreadBadgeCount
