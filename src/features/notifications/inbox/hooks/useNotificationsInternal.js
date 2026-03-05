// src/features/notifications/inbox/hooks/useNotificationsInternal.js
import { useEffect, useState, useCallback } from 'react'
import { getNotifications } from '../controller/Notifications.controller'

export default function useNotificationsInternal(identity) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const notifications = await getNotifications(identity)
      setRows(notifications)
    } finally {
      setLoading(false)
    }
  }, [identity])

  useEffect(() => {
    load()
  }, [load])

  // ✅ optimistic list mutations (replace a notification with another)
  useEffect(() => {
    const onReplace = (e) => {
      const { removeId, add } = e?.detail ?? {}
      if (!removeId || !add) return

      setRows((prev) => {
        const next = prev.filter((n) => n.id !== removeId)
        return [add, ...next]
      })
    }

    window.addEventListener('noti:optimistic:replace', onReplace)
    return () => window.removeEventListener('noti:optimistic:replace', onReplace)
  }, [])

  return { rows, loading, reload: load }
}