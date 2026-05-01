// src/features/notifications/inbox/hooks/useMarkNotificationsRead.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markRead } from '@notifications'
import { markAllNotificationsSeen } from '../controller/NotificationsHeader.controller'
import { queryKeys } from '@/queries/queryKeys'
import { useBootstrapStore } from '@/bootstrap/bootstrap.store'

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const actorId = useBootstrapStore((s) => s.hydratedForActorId)

  return useMutation({
    mutationFn: ({ recipientId }) => markRead({ recipientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsInbox(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const actorId = useBootstrapStore((s) => s.hydratedForActorId)

  return useMutation({
    mutationFn: () => markAllNotificationsSeen(actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsInbox(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) })
    },
  })
}
