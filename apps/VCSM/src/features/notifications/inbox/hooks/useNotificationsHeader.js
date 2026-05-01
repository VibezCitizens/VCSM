import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { markAllNotificationsSeen } from '../controller/NotificationsHeader.controller'
import { useNotificationUnread } from '@/bootstrap/bootstrap.selectors'
import { queryKeys } from '@/queries/queryKeys'

export function useNotificationsHeader(actorId) {
  const queryClient = useQueryClient()
  const unreadCount = useNotificationUnread()

  const markAllSeen = useCallback(async () => {
    if (!actorId) return

    await markAllNotificationsSeen(actorId)
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationsInbox(actorId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) })
  }, [actorId, queryClient])

  return { unreadCount, loading: false, markAllSeen }
}
