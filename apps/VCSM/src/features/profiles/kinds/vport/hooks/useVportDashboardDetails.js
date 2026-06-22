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

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { getVportPublicDetailsController } from '@/features/profiles/kinds/vport/controller/getVportPublicDetails.controller'

export function useVportDashboardDetails(actorId) {
  const query = useQuery({
    queryKey: queryKeys.vportPublicDetails(actorId),
    queryFn: () => getVportPublicDetailsController(actorId),
    enabled: !!actorId,
    staleTime: 60_000,
    gcTime: 300_000,
  })

  return {
    loading: query.isLoading,
    details: query.data ?? null,
    error: query.error ?? null,
  }
}

export default useVportDashboardDetails
