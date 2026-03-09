import { useEffect, useState } from 'react'

import { getTopFriendCandidatesController } from '@/features/profiles/adapters/friends/topFriends.adapter'
import { hydrateActorsIntoStore } from '@/features/profiles/adapters/friends/topFriends.adapter'

export function useTopFriendCandidates({ ownerActorId, existingIds = [], maxRanks = 10, open = false } = {}) {
  const [loading, setLoading] = useState(true)
  const [candidateIds, setCandidateIds] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) {
      setLoading(false)
      return
    }

    if (!ownerActorId) {
      setCandidateIds([])
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getTopFriendCandidatesController({
          ownerActorId,
          existingIds,
          maxRanks,
        })

        if (!result?.ok) {
          throw result?.error || new Error('Failed to load candidate ids')
        }

        const ids = result?.data?.candidateIds ?? []
        await hydrateActorsIntoStore(ids)

        if (!cancelled) {
          setCandidateIds(ids)
        }
      } catch (err) {
        console.error('[useTopFriendCandidates] failed', {
          ownerActorId,
          message: err?.message ?? null,
          code: err?.code ?? null,
          details: err?.details ?? null,
          hint: err?.hint ?? null,
          error: err,
        })

        if (!cancelled) {
          setCandidateIds([])
          setError(err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, ownerActorId, existingIds, maxRanks])

  return {
    loading,
    candidateIds,
    error,
  }
}

