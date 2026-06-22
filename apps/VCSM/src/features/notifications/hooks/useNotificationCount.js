import { queryClient } from '@/queries/queryClient'
import { queryKeys } from '@/queries/queryKeys'
import { getUnreadNotificationCount } from '@/features/notifications/inbox/controller/notificationsCount.controller'

// Must match useNotificationInbox's staleTime/refetchInterval so the inbox cache
// is always within this window while the notifications screen is mounted.
const CACHE_FRESHNESS_MS = 60_000

// Returns unread count from the notification inbox React Query cache, or null
// when cache is absent, stale, or rows do not carry the isRead field.
// The inbox loads up to 20 rows — if every row is unread the true total may
// exceed the page limit, so we fall through to DB in that case for accuracy.
function deriveCountFromInboxCache(actorId) {
  const state = queryClient.getQueryState(queryKeys.notificationsInbox(actorId))
  if (!state?.dataUpdatedAt) return null
  if (Date.now() - state.dataUpdatedAt > CACHE_FRESHNESS_MS) return null

  const cached = state.data
  if (!Array.isArray(cached)) return null
  if (cached.length === 0) return 0
  if (!Object.prototype.hasOwnProperty.call(cached[0], 'isRead')) return null

  const unreadCount = cached.filter((row) => !row.isSeen).length

  // All visible rows are unread — inbox page limit means the actual total could
  // be higher than what's cached. Fall through to DB for the accurate count.
  if (unreadCount === cached.length) return null

  return unreadCount
}

export async function getNotificationUnreadCount(actorId) {
  if (!actorId) return 0
  const fromCache = deriveCountFromInboxCache(actorId)
  if (fromCache !== null) return fromCache
  return getUnreadNotificationCount(actorId)
}
