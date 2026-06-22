// src/features/notifications/inbox/hooks/useNotificationInbox.js
//
// Single React Query source of truth for the notification inbox.
// Realtime is intentionally disabled on /notifications for now; refresh paths
// invalidate React Query keys and polling keeps the inbox + badge current.

import { useEffect, useCallback } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { getNotifications } from '../controller/Notifications.controller'
import { useSocialFollowRequestOps } from '@/features/social/adapters/social.adapter'

const STALE_MS = 60_000

export function useNotificationInbox() {
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null
  const queryClient = useQueryClient()
  const { listIncomingRequests } = useSocialFollowRequestOps()

  const query = useQuery({
    queryKey: queryKeys.notificationsInbox(actorId),
    queryFn: () => getNotifications(identity, { listIncomingRequests }),
    enabled: !!actorId,
    staleTime: STALE_MS,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchInterval: STALE_MS,
    refetchIntervalInBackground: false,
    // Keep previous rows visible during background refetch — no skeleton flash.
    // Safe for actor isolation: different actorIds produce different query keys,
    // so keepPreviousData returns undefined on actor switch → skeleton shows correctly.
    placeholderData: keepPreviousData,
  })

  const invalidateNotificationQueries = useCallback(() => {
    if (!actorId) return Promise.resolve()

    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsInbox(actorId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) }),
    ])
  }, [actorId, queryClient])

  // noti:refresh -> invalidate both notification queries. No realtime channel is created here.
  useEffect(() => {
    if (!actorId) return undefined

    const handler = () => {
      void invalidateNotificationQueries()
    }

    window.addEventListener('noti:refresh', handler)
    return () => window.removeEventListener('noti:refresh', handler)
  }, [actorId, invalidateNotificationQueries])

  // After each successful inbox fetch, autoMarkSeen has already run in the DB.
  // Re-invalidate the badge so it reflects the cleared unseen count immediately
  // rather than waiting for the next 60s polling cycle or a second navigation.
  useEffect(() => {
    if (!actorId || !query.isSuccess || query.dataUpdatedAt === 0) return
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) })
  }, [query.dataUpdatedAt, actorId, queryClient]) // eslint-disable-line react-hooks/exhaustive-deps

  // noti:optimistic:replace -> patch list without a network round-trip.
  useEffect(() => {
    if (!actorId) return undefined

    const onReplace = (e) => {
      const { removeId, add } = e?.detail ?? {}
      if (!removeId || !add) return

      queryClient.setQueryData(queryKeys.notificationsInbox(actorId), (prev) => {
        if (!Array.isArray(prev)) return prev
        return [add, ...prev.filter((n) => n.id !== removeId)]
      })
    }

    window.addEventListener('noti:optimistic:replace', onReplace)
    return () => window.removeEventListener('noti:optimistic:replace', onReplace)
  }, [actorId, queryClient])

  // Skeleton only on cold open (no cache, no placeholder).
  // On warm open (cache or placeholder data present): rows render immediately.
  const loading = query.isPending && !query.isPlaceholderData

  return {
    rows: query.data ?? [],
    loading,
    isRefreshing: query.isFetching && !query.isPending,
    reload: invalidateNotificationQueries,
    error: query.error ?? null,
  }
}
