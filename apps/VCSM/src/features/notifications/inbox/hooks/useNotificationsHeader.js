import { useCallback, useEffect, useState } from 'react'
import {
  loadNotificationHeader,
  markAllNotificationsSeen,
} from '../controller/NotificationsHeader.controller'

export function useNotificationsHeader(actorId) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!actorId) return
    setLoading(true)
    const res = await loadNotificationHeader(actorId)
    setUnreadCount(res.unreadCount)
    setLoading(false)
  }, [actorId])

  const markAllSeen = useCallback(async () => {
    await markAllNotificationsSeen(actorId)
    setUnreadCount(0)
    window.dispatchEvent(new Event('noti:refresh'))
  }, [actorId])

  useEffect(() => {
    refresh()
    window.addEventListener('noti:refresh', refresh)
    return () => window.removeEventListener('noti:refresh', refresh)
  }, [refresh])

  return { unreadCount, loading, markAllSeen }
}
