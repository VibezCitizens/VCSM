import { useCallback, useEffect, useState } from 'react'

import { getTopFriendActorIdsController } from '@/features/profiles/adapters/friends/topFriends.adapter'
import { hydrateActorsIntoStore } from '@/features/profiles/adapters/friends/topFriends.adapter'

export function useTopFriendActorIds({
  ownerActorId,
  limit = 10,
  version = 0,
  reconcile = false,
  autofill = true,
} = {}) {
  const [actorIds, setActorIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!ownerActorId) {
      setActorIds([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getTopFriendActorIdsController({
        ownerActorId,
        limit,
        reconcile,
        autofill,
      })

      if (!result?.ok) {
        throw result?.error || new Error('Failed to load top friends')
      }

      const nextIds = result?.data?.actorIds ?? []
      await hydrateActorsIntoStore(nextIds)
      setActorIds(nextIds)
    } catch (err) {
      console.error('[useTopFriendActorIds] failed', {
        ownerActorId,
        message: err?.message ?? null,
        code: err?.code ?? null,
        details: err?.details ?? null,
        hint: err?.hint ?? null,
        error: err,
      })
      setActorIds([])
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [ownerActorId, limit, reconcile, autofill])

  useEffect(() => {
    refresh()
  }, [refresh, version])

  return {
    actorIds,
    loading,
    error,
    refresh,
  }
}

