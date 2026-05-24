// ============================================================
// Bootstrap Invalidation
// Call these from write paths that change unread state.
// Each function invalidates the relevant React Query cache
// for the currently hydrated actorId.
// ============================================================

import { useBootstrapStore } from './bootstrap.store'
import { queryClient } from '@/queries/queryClient'
import { queryKeys } from '@/queries/queryKeys'

const DEV = import.meta.env?.DEV
let _dbg = null
async function dbg() {
  if (!DEV) return null
  if (!_dbg) _dbg = (await import('@/features/chat/debug/chatBadgeDebugger')).chatBadgeDbg
  return _dbg
}

/** Force re-fetch of the notification unread count. */
export function invalidateNotificationUnread() {
  const { hydratedForActorId } = useBootstrapStore.getState()
  if (hydratedForActorId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(hydratedForActorId) })
  }
}

/** Force re-fetch of the chat unread count. */
export async function invalidateChatUnread(reason = 'write-path') {
  const { hydratedForActorId } = useBootstrapStore.getState()
  if (hydratedForActorId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread(hydratedForActorId) })
    ;(await dbg())?.invalidate(reason)
  }
}

/** Reset all bootstrap state. Call on logout or actor switch. */
export function invalidateBootstrap() {
  useBootstrapStore.getState().reset()
}

/**
 * Evict all cached chat message pages from the React Query cache.
 * Use removeQueries (hard evict) rather than invalidateQueries so that
 * actor A's messages are gone immediately — not just marked stale.
 * Must be called on both actor switch and logout.
 */
export function purgeChatMessageCache() {
  queryClient.removeQueries({ queryKey: ['chat', 'messages'] })
}

/**
 * Evict all notification cache entries (inbox + badge) from the React Query cache.
 * Hard evict so actor A's notifications never bleed into actor B's session.
 * Must be called on both actor switch and logout.
 */
export function purgeNotificationCache() {
  queryClient.removeQueries({ queryKey: ['notifications'] })
}
