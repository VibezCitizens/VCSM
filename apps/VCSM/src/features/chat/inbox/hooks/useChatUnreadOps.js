import { queryClient } from '@/queries/queryClient'
import { queryKeys } from '@/queries/queryKeys'
import { getChatInboxUnreadBadgeCount } from '@/features/chat/inbox/controller/chatUnread.controller'

// Must match useChatInbox's refetch interval so the cache is always within this window
// while the inbox screen is mounted.
const CACHE_FRESHNESS_MS = 30_000

// Returns total unread count derived from the main inbox React Query cache,
// or null when the cache is absent, stale, or missing the unread_count field.
// Covers folder='inbox' only — requests/spam are not cached here and fall
// through to the DB path on return null.
function deriveCountFromInboxCache(actorId) {
  const state = queryClient.getQueryState(queryKeys.chatInbox(actorId))
  if (!state?.dataUpdatedAt) return null
  if (Date.now() - state.dataUpdatedAt > CACHE_FRESHNESS_MS) return null

  const cached = state.data
  if (!Array.isArray(cached)) return null
  if (cached.length === 0) return 0
  if (!Object.prototype.hasOwnProperty.call(cached[0], 'unread_count')) return null

  return cached.reduce((sum, row) => sum + Number(row.unread_count ?? 0), 0)
}

async function getUnreadBadgeCount(actorId) {
  if (!actorId) return 0
  const fromCache = deriveCountFromInboxCache(actorId)
  if (fromCache !== null) return fromCache
  return getChatInboxUnreadBadgeCount(actorId)
}

export function useChatUnreadOps() {
  return { getUnreadBadgeCount }
}
