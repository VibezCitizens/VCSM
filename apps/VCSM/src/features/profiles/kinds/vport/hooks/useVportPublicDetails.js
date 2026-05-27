// src/features/profiles/kinds/vport/hooks/useVportPublicDetails.js
//
// @deprecated — This hook serves authenticated VPORT dashboard surfaces
// (VportDashboardScreen, VportSettingsScreen, VportActorMenuFlyerView) via the
// profiles adapter. The returned `details` shape is dashboard-specific and uses
// the profiles controller + DAL chain, not the public vportMenu module.
//
// For PUBLIC-facing surfaces (online menu, QR views, reviews page) use the
// canonical hook instead:
//   import { useVportPublicDetails } from
//     '@/features/public/vportMenu/adapters/vportMenu.adapter';
//
// Do NOT add new consumers to this hook. New authenticated dashboard reads
// should be evaluated to use the canonical hook or a purpose-built controller.

import { useEffect, useState } from 'react'
import { getVportPublicDetailsController } from '@/features/profiles/kinds/vport/controller/getVportPublicDetails.controller'

export function useVportPublicDetails(actorId) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true

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

        const d = await getVportPublicDetailsController(actorId)
        if (!alive) return

        setDetails(d ?? null)
      } catch (e) {
        if (!alive) return
        setError(e)
        setDetails(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [actorId])

  return { loading, details, error }
}
