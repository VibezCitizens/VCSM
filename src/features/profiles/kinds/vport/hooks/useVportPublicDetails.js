// src/features/profiles/kinds/vport/hooks/useVportPublicDetails.js

import { useEffect, useState } from 'react'
import { getVportPublicDetailsController } from '@/features/profiles/kinds/vport/controller/getVportPublicDetails.controller'

export function useVportPublicDetails(actorId) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true

    const dev =
      typeof process !== "undefined"
        ? process.env.NODE_ENV !== "production"
        : true

    async function run() {
      if (!actorId) {
        if (!alive) return
        setDetails(null)
        setError(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        if (dev) {
          console.groupCollapsed("[useVportPublicDetails] fetch start")
          console.log("actorId:", actorId)
          console.groupEnd()
        }

        const d = await getVportPublicDetailsController(actorId)
        if (!alive) return

        if (dev) {
          console.groupCollapsed("[useVportPublicDetails] fetch done")
          console.log("actorId:", actorId)
          console.log("details:", d)
          console.groupEnd()
        }

        setDetails(d ?? null)
      } catch (e) {
        if (!alive) return
        setError(e)
        setDetails(null)

        if (dev) {
          console.groupCollapsed("[useVportPublicDetails] fetch error")
          console.log("actorId:", actorId)
          console.error(e)
          console.groupEnd()
        }
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [actorId])

  return { loading, details, error }
}