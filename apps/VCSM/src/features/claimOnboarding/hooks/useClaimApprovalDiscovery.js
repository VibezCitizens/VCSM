// TICKET-TRAZE-CLAIM-VPORT-007 (T7) — discover approved-claim VPORTs the owner
// has not yet onboarded. Pull-based: works whether or not a push notification
// fired (covers "ignored notification" / "logs in later").

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/AuthProvider'
import { loadApprovedClaimVports } from '@/features/claimOnboarding/controllers/loadApprovedClaimVports.controller'
import {
  isClaimWelcomeAcknowledged,
  acknowledgeClaimWelcome,
} from '@/features/claimOnboarding/model/claimOnboarding.model'

export function useClaimApprovalDiscovery() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  // Actors acknowledged this session; combined with the localStorage record so
  // the filter recomputes immediately after acknowledge() without a refetch.
  const [ackedIds, setAckedIds] = useState(() => new Set())

  const query = useQuery({
    queryKey: ['claim-onboarding', userId],
    queryFn: loadApprovedClaimVports,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  })

  const items = useMemo(() => query.data ?? [], [query.data])

  const pending = useMemo(
    () => items.filter(
      (i) => !ackedIds.has(i.vportActorId) && !isClaimWelcomeAcknowledged(i.vportActorId),
    ),
    [items, ackedIds],
  )

  const acknowledge = useCallback((vportActorId) => {
    acknowledgeClaimWelcome(vportActorId)
    setAckedIds((prev) => {
      const next = new Set(prev)
      next.add(vportActorId)
      return next
    })
  }, [])

  return {
    pending,
    items,
    loading: query.isLoading,
    error: query.error ?? null,
    acknowledge,
    reload: query.refetch,
  }
}
