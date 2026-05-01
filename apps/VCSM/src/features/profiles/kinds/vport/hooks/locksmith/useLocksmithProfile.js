// ============================================================
// VCSM — Locksmith Profile Data Hook
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { getLocksmithProfileController } from '@/features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller'

/**
 * Hook for locksmith-specific profile data (service areas + service details).
 * Returns null-safe data — non-locksmith vports get empty arrays.
 *
 * gapServices: enabled services that have no locksmith_service_details row yet.
 * These appear in the dashboard as "Needs configuration".
 */
export function useLocksmithProfile(actorId, vportType) {
  const [serviceAreas, setServiceAreas] = useState([])
  const [serviceDetails, setServiceDetails] = useState([])
  const [gapServices, setGapServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const mountedRef = useRef(false)

  const isLocksmith = String(vportType ?? '').toLowerCase() === 'locksmith'

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    if (!actorId || !isLocksmith) {
      setServiceAreas([])
      setServiceDetails([])
      setGapServices([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getLocksmithProfileController(actorId)

      if (!mountedRef.current) return

      setServiceAreas(result.serviceAreas)
      setServiceDetails(result.serviceDetails)
      setGapServices(result.gapServices)
    } catch (e) {
      if (mountedRef.current) setError(e)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [actorId, isLocksmith])

  useEffect(() => {
    load()
  }, [load])

  return {
    isLocksmith,
    serviceAreas,
    serviceDetails,
    gapServices,
    loading,
    error,
    reload: load,
  }
}
