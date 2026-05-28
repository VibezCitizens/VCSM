// src/features/social/friend/request/hooks/useIncomingFollowRequests.js

import { useEffect, useState } from 'react'
import { ctrlListIncomingRequests } from '@/features/social/friend/request/controllers/followRequests.controller'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { modelFollowRequest } from '../models/followRequest.model'
import { hydrateActorsFromRows } from '@/state/actors/hydrateActors'
import { useFollowRequestsStore } from '@/state/social/followRequestsStore'

export function useIncomingFollowRequests(targetActorId) {
  const { identity } = useIdentity()
  const sessionActorId = identity?.actorId ?? null

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)

  // 🔥 INVALIDATION SIGNAL
  const version = useFollowRequestsStore((s) => s.version)

  useEffect(() => {
    if (!targetActorId) return

    let alive = true
    setLoading(true)

    // 🔒 assertingActorId derived from session identity (V-SUB-003)
    ctrlListIncomingRequests({ targetActorId, assertingActorId: sessionActorId })
      .then(async (rows) => {
        if (!alive) return

        // 🔥 hydrate requester actors
        await hydrateActorsFromRows(
          rows.map((r) => ({
            actorId: r.requester_actor_id,
          }))
        )

        setRequests(rows.map(modelFollowRequest))
      })
      .catch(() => {
        if (alive) setRequests([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [targetActorId, version]) // 🔥 THIS LINE IS THE FIX

  return { requests, loading }
}
