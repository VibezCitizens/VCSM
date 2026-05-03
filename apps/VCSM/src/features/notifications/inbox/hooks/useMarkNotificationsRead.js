// src/features/notifications/inbox/hooks/useMarkNotificationsRead.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markRead } from '@notifications'
import { markAllNotificationsSeen } from '../controller/NotificationsHeader.controller'
import { queryKeys } from '@/queries/queryKeys'
import { useBootstrapStore } from '@/bootstrap/bootstrap.store'

const DEV = import.meta.env?.DEV

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const actorId = useBootstrapStore((s) => s.hydratedForActorId)

  return useMutation({
    mutationFn: ({ recipientId }) => markRead({ recipientId }),
    onMutate: async ({ recipientId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notificationsInbox(actorId) })
      const prev = queryClient.getQueryData(queryKeys.notificationsInbox(actorId))

      queryClient.setQueryData(queryKeys.notificationsInbox(actorId), (rows) => {
        if (!Array.isArray(rows)) return rows
        return rows.map((n) =>
          n.id === recipientId ? { ...n, isRead: true, isSeen: true } : n
        )
      })

      if (DEV) console.log('[noti:cards:optimistic-update]', { recipientId })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.notificationsInbox(actorId), ctx.prev)
      }
      if (DEV) console.log('[noti:cards:rollback]', { reason: 'markRead failed' })
    },
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notificationsInbox(actorId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.notificationUnread(actorId) })

      const prevRows = queryClient.getQueryData(queryKeys.notificationsInbox(actorId))
      const prevCount = queryClient.getQueryData(queryKeys.notificationUnread(actorId))

      queryClient.setQueryData(queryKeys.notificationsInbox(actorId), (rows) => {
        if (!Array.isArray(rows)) return rows
        return rows.map((n) => ({ ...n, isRead: true, isSeen: true }))
      })
      queryClient.setQueryData(queryKeys.notificationUnread(actorId), 0)

      if (DEV) console.log('[noti:cards:optimistic-update]', { all: true })
      return { prevRows, prevCount }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevRows !== undefined) {
        queryClient.setQueryData(queryKeys.notificationsInbox(actorId), ctx.prevRows)
      }
      if (ctx?.prevCount !== undefined) {
        queryClient.setQueryData(queryKeys.notificationUnread(actorId), ctx.prevCount)
      }
      if (DEV) console.log('[noti:cards:rollback]', { reason: 'markAllRead failed' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsInbox(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) })
    },
  })
}
