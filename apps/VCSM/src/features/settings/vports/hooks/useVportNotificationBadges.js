// src/features/settings/vports/hooks/useVportNotificationBadges.js
//
// Fetches unread notification counts for a list of VPORT actors in one DB round trip.
// Replaces the previous N-parallel-query pattern (NOTI-PERF-002).
//
// On success, populates each actor's individual notificationUnread cache entry so
// the global badge (useNotificationUnread) reads warm data when switching VPORT contexts.
//
// Returns a stable lookup: getCount(actorId) → number.

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { getUnreadNotificationCountBatch } from '@/features/notifications/adapters/notifications.adapter'

const STALE_MS = 60_000

export function useVportNotificationBadges(vports) {
  const safeVports = vports ?? []
  const queryClient = useQueryClient()
  const actorIds = safeVports.map((v) => v.actor_id).filter(Boolean)

  // Stable key: sorted actor IDs joined so identity is order-independent.
  const batchKey = actorIds.slice().sort().join(',')

  const { data: countMap = {} } = useQuery({
    queryKey: ['notifications', 'unread', 'vport-batch', batchKey],
    queryFn: async () => {
      const result = await getUnreadNotificationCountBatch(actorIds)

      // Warm individual cache entries so useNotificationUnread sees fresh data
      // immediately when the user switches into any VPORT context.
      for (const [actorId, count] of Object.entries(result)) {
        queryClient.setQueryData(queryKeys.notificationUnread(actorId), count)
      }

      return result
    },
    enabled: actorIds.length > 0,
    staleTime: STALE_MS,
    gcTime: 5 * STALE_MS,
  })

  return (actorId) => countMap[actorId] ?? 0
}
