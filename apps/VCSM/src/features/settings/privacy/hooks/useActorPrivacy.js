import { useCallback, useEffect, useState } from 'react'
import {
  ctrlGetActorPrivacy,
  ctrlSetActorPrivacy,
} from '@/features/settings/privacy/controller/actorPrivacy.controller'

export function useActorPrivacy(actorId) {
  const [loading, setLoading] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true

    async function load() {
      if (!actorId) {
        setLoading(false)
        setIsPrivate(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const value = await ctrlGetActorPrivacy(actorId)
        if (!alive) return
        setIsPrivate(Boolean(value))
      } catch (e) {
        if (!alive) return
        setError(e?.message || String(e))
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [actorId])

  const togglePrivacy = useCallback(async () => {
    if (loading || !actorId) return

    setLoading(true)
    setError(null)

    try {
      const next = !isPrivate
      await ctrlSetActorPrivacy({ actorId, isPrivate: next })
      setIsPrivate(next)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [actorId, isPrivate, loading])

  return {
    loading,
    isPrivate,
    error,
    togglePrivacy,
  }
}
