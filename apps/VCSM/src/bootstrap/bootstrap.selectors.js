// ============================================================
// Bootstrap Selectors
// Typed hooks for reading bootstrap values.
// Unread counts are React Query — polling replaces manual intervals.
// Import these in components — never read the store directly.
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { useBootstrapStore } from './bootstrap.store'
import { queryKeys } from '@/queries/queryKeys'
import { getUnreadNotificationCount } from '@/features/notifications/inbox/controller/notificationsCount.controller'
import { useChatUnreadOps } from '@/features/chat/adapters/chat.adapter'

const NOTIFICATION_POLL_MS = 60_000
const CHAT_POLL_MS = 30_000

/** Returns the current unread notification count for the active actor. */
export function useNotificationUnread() {
  const actorId = useBootstrapStore((s) => s.hydratedForActorId)
  const { data } = useQuery({
    queryKey: queryKeys.notificationUnread(actorId),
    queryFn: () => getUnreadNotificationCount(actorId),
    enabled: !!actorId,
    staleTime: NOTIFICATION_POLL_MS,
    refetchInterval: NOTIFICATION_POLL_MS,
    placeholderData: 0,
  })
  return data ?? 0
}

/** Returns the current unread chat count for the active actor. */
export function useChatUnread() {
  const actorId = useBootstrapStore((s) => s.hydratedForActorId)
  const { getUnreadBadgeCount } = useChatUnreadOps()
  const { data } = useQuery({
    queryKey: queryKeys.chatUnread(actorId),
    queryFn: () => getUnreadBadgeCount(actorId),
    enabled: !!actorId,
    staleTime: CHAT_POLL_MS,
    refetchInterval: CHAT_POLL_MS,
    placeholderData: 0,
  })
  return data ?? 0
}

/** Returns true while the initial bootstrap hydration is in progress. */
export function useBootstrapLoading() {
  return useBootstrapStore((s) => s.loading)
}

/** Returns the timestamp of the last successful hydration (ms), or null. */
export function useBootstrapHydratedAt() {
  return useBootstrapStore((s) => s.hydratedAt)
}
