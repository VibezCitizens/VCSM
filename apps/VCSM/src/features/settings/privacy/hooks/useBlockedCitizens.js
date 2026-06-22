import { useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import {
  ctrlListMyBlocks,
  ctrlBlockActor,
  ctrlUnblockActor,
} from '@/features/settings/privacy/controller/Blocks.controller'
import { hydrateActorsFromRows } from '@/state/actors/hydrateActors'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'

export function useBlockedCitizens(actorId, scope) {
  const { identity } = useIdentity()
  const sessionActorId = identity?.actorId ?? null
  const qc = useQueryClient()
  const key = queryKeys.settingsBlockedCitizens(actorId)

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const list = await ctrlListMyBlocks({ actorId, scope })
      await hydrateActorsFromRows(list.map((b) => ({ actorId: b.blockedActorId })))
      return list
    },
    enabled: !!actorId && !!scope,
    staleTime: 2 * 60 * 1000,
  })

  const blocks = query.data ?? []
  const blockedIds = useMemo(() => new Set(blocks.map((b) => b.blockedActorId)), [blocks])

  const refresh = useCallback(
    () => qc.invalidateQueries({ queryKey: key }),
    [qc, key]
  )

  const blockMutation = useMutation({
    mutationFn: (blockedActorId) =>
      ctrlBlockActor({ actorId, blockedActorId, scope, existingBlockedIds: blockedIds, callerActorId: sessionActorId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const unblockMutation = useMutation({
    mutationFn: (blockedActorId) =>
      ctrlUnblockActor({ actorId, blockedActorId, scope, existingBlockedIds: blockedIds, callerActorId: sessionActorId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const block = useCallback((id) => blockMutation.mutate(id), [blockMutation])
  const unblock = useCallback((id) => unblockMutation.mutate(id), [unblockMutation])

  return {
    loading: query.isLoading || blockMutation.isPending || unblockMutation.isPending,
    error:
      query.error?.message ??
      blockMutation.error?.message ??
      unblockMutation.error?.message ??
      null,
    blocks,
    blockedIds,
    refresh,
    block,
    unblock,
  }
}
