// ============================================================
// VCSM — Locksmith Owner Management Hook
// ============================================================

import { useCallback, useMemo, useState } from 'react'
import { useIdentity } from '@/state/identity/identityContext'
import {
  ctrlAddServiceArea,
  ctrlUpdateServiceArea,
  ctrlDeleteServiceArea,
  ctrlSaveServiceDetail,
  ctrlSavePortfolioDetail,
} from '@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller'

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
      onSuccess?.()
      return result
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setSaving(false)
    }
  }, [onSuccess])

  const addArea = useCallback((area) => wrap(() => ctrlAddServiceArea(actorId, area)), [actorId, wrap])
  const updateArea = useCallback((areaId, updates) => wrap(() => ctrlUpdateServiceArea(actorId, areaId, updates)), [actorId, wrap])
  const deleteArea = useCallback((areaId) => wrap(() => ctrlDeleteServiceArea(actorId, areaId)), [actorId, wrap])
  const saveServiceDetail = useCallback((serviceId, detail) => wrap(() => ctrlSaveServiceDetail(actorId, serviceId, detail)), [actorId, wrap])
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
