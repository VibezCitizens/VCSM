import { readChatInboxUnreadRowsDAL } from '@/features/chat/inbox/dal/inboxUnread.read.dal'

const DEV = import.meta.env?.DEV

// Lazy-load debugger in dev only — zero cost in production.
let _dbg = null
async function dbg() {
  if (!DEV) return null
  if (!_dbg) _dbg = (await import('@/features/chat/debug/chatBadgeDebugger')).chatBadgeDbg
  return _dbg
}

export async function getChatInboxUnreadBadgeCount(actorId) {
  if (!actorId) return 0

  const d = await dbg()
  const token = d?.startFetch(actorId)

  try {
    const rows = await readChatInboxUnreadRowsDAL(actorId)
    const count = rows.reduce((sum, row) => sum + Number(row?.unread_count || 0), 0)
    d?.endFetch(token, count)
    return count
  } catch (err) {
    if (DEV) console.error('[chatUnread] badge count fetch failed:', err)
    d?.endFetchError(token)
    return 0
  }
}

export const getInboxUnreadBadgeCount = getChatInboxUnreadBadgeCount
