// ============================================================
// VCSM — Locksmith Owner Management Hook
// ============================================================

import { useCallback, useMemo, useState } from 'react'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import {
  ctrlAddServiceArea,
  ctrlUpdateServiceArea,
  ctrlDeleteServiceArea,
  ctrlSaveServiceDetail,
  ctrlSavePortfolioDetail,
} from '@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller'
import { invalidateLocksmithProfileCache } from '@/features/profiles/kinds/vport/hooks/locksmith/useLocksmithProfile'

/**
 * Hook for locksmith owner CRUD operations.
 * Pairs with useLocksmithProfile for read data.
 */
export function useLocksmithOwner(actorId, { onSuccess } = {}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const { identity, availableActors } = useIdentity()
  const identityActorId = useMemo(() => {
    if (identity?.kind === 'user') return identity.actorId ?? null
    return availableActors?.find((a) => a.kind === 'user')?.actorId ?? null
  }, [identity, availableActors])

  const wrap = useCallback(async (fn) => {
    setSaving(true)
    setError(null)
    try {
      const result = await fn()
      invalidateLocksmithProfileCache(actorId)
      onSuccess?.()
      return result
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setSaving(false)
    }
  }, [actorId, onSuccess])

  const addArea = useCallback((area) => wrap(() => ctrlAddServiceArea(identityActorId, actorId, area)), [identityActorId, actorId, wrap])
  const updateArea = useCallback((areaId, updates) => wrap(() => ctrlUpdateServiceArea(identityActorId, actorId, areaId, updates)), [identityActorId, actorId, wrap])
  const deleteArea = useCallback((areaId) => wrap(() => ctrlDeleteServiceArea(identityActorId, actorId, areaId)), [identityActorId, actorId, wrap])
  const saveServiceDetail = useCallback((serviceId, detail) => wrap(() => ctrlSaveServiceDetail(identityActorId, actorId, serviceId, detail)), [identityActorId, actorId, wrap])
  const savePortfolioDetail = useCallback(
    (portfolioItemId, detail) => wrap(() => ctrlSavePortfolioDetail(identityActorId, actorId, portfolioItemId, detail)),
    [identityActorId, actorId, wrap]
  )

  return {
    saving,
    error,
    addArea,
    updateArea,
    deleteArea,
    saveServiceDetail,
    savePortfolioDetail,
  }
}
