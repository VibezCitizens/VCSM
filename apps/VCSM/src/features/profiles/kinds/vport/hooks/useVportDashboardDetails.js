// src/features/profiles/kinds/vport/hooks/useVportDashboardDetails.js
//
// Rich details hook for authenticated VPORT owner-dashboard surfaces:
//   VportDashboardScreen, VportSettingsScreen, VportActorMenuFlyerView.
//
// Returns the full dashboard details shape including owner-only fields:
//   vportType, hours, accentColor, flyerFoodImage1/2, highlights,
//   languages, paymentMethods, priceTier, logoUrl, socialLinks,
//   bookingUrl, profileId, and more.
//
// This hook uses the profiles controller + DAL chain (60s TTL cache).
// It is NOT the public-facing hook — for PUBLIC surfaces (online menu,
// QR views, reviews page) use the canonical hook:
//   import { useVportPublicDetails } from
//     '@/features/public/vportMenu/adapters/vportMenu.adapter';

import { useEffect, useState } from 'react'
import { getVportPublicDetailsController } from '@/features/profiles/kinds/vport/controller/getVportPublicDetails.controller'

export function useVportDashboardDetails(actorId) {
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

export default useVportDashboardDetails
