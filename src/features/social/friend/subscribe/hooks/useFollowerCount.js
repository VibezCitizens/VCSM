import { useEffect, useState, useCallback } from 'react'
import { dalCountSubscribers } from '../dal/subscriberCount.dal'

export function useFollowerCount(targetActorId) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  useEffect(() => {
    let alive = true

    if (!targetActorId) {
      setCount(0)
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)

      try {
        const value = await dalCountSubscribers({
          actorId: targetActorId,
        })

        if (!alive) return
        setCount(value)
      } catch {
        if (!alive) return
        setCount(0)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [targetActorId, refreshKey])

  return {
    count,
    loading,
    refresh,
  }
}
