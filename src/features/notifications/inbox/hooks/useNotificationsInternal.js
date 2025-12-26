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

  return { rows, loading, reload: load }
}
