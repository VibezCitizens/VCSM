// src/features/settings/vports/hooks/useVportNotificationBadges.js
//
// Fetches unread notification counts for a list of VPORT actors in parallel.
// Uses the same query key as the global badge (notificationUnread) so the cache
// is shared — switching into a VPORT after viewing this screen hits warm cache.
//
// Returns a stable lookup: getCount(actorId) → number.
// Queries start on mount; they never block rendering.

import { useQueries } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { getUnreadNotificationCount } from '@/features/notifications/adapters/notifications.adapter'

const STALE_MS = 60_000

export function useVportNotificationBadges(vports) {
  const safeVports = vports ?? []

  const results = useQueries({
    queries: safeVports.map((v) => ({
      queryKey: queryKeys.notificationUnread(v.actor_id),
      queryFn: () => getUnreadNotificationCount(v.actor_id),
      enabled: !!v.actor_id,
      staleTime: STALE_MS,
      gcTime: 5 * STALE_MS,
    })),
  })

  return (actorId) => {
    const idx = safeVports.findIndex((v) => v.actor_id === actorId)
    return idx >= 0 ? (results[idx]?.data ?? 0) : 0
  }
}
