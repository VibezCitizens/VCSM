// src/features/notifications/inbox/hooks/useNotificationInbox.js
//
// Single React Query source of truth for the notification inbox.
// Realtime is intentionally disabled on /notifications for now; refresh paths
// invalidate React Query keys and polling keeps the inbox + badge current.

import { useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { getNotifications } from '../controller/Notifications.controller'
import { useSocialFollowRequestOps } from '@/features/social/adapters/social.adapter'
import { queryKeys } from '@/queries/queryKeys'

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

  return {
    rows: query.data ?? [],
    loading: query.isPending,
    reload: invalidateNotificationQueries,
    error: query.error ?? null,
  }
}
