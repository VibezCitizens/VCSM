---
title: Settings Module — Behavior
status: STUB
feature: ads
module: settings
source: architect-derived
created: 2026-06-05
---

# ads / modules / settings — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review. Full trace pending source read.

## Confirmed Behaviors

### Load Ads Settings Screen
- Citizen navigates to /ads/vport/:actorId
- VportAdsSettingsScreen mounts; actorId sourced from URL params via useParams()
- SECURITY GAP: no OwnerOnlyDashboardGuard wrap; no session ownership cross-check
- useVportAds(actorId) called to hydrate ad list from localStorage

### Create New Ad Draft
- Citizen taps "Create Ad" / "New Ad" CTA in settings screen
- useVportAds triggers saveDraftUseCase via pipeline module
- Draft written to localStorage; screen re-renders with new draft in list

### Delete Ad
- Citizen taps delete on an ad in the list
- useVportAds triggers deleteAdUseCase via pipeline module
- SECURITY GAP: no ownership pre-check in use case (VEN-ADS-004)

### Navigate Back
- VportAdsBackButton.jsx — back navigation to VPORT dashboard

## SECURITY GAP: Route Not Guarded
Route /ads/vport/:actorId is not inside OwnerOnlyDashboardGuard. Any authenticated Citizen can navigate to another actor's ads settings URL and load their ad pipeline. This is a HIGH finding that escalates to CRITICAL on Supabase migration.

## TODO

- [ ] Confirm full actorId resolution path in useVportAds.js
- [ ] Confirm whether useVportAds.adapter.js is the actual call chain entry or if VportAdsSettingsScreen calls the hook directly
- [ ] Confirm all available actions in settings screen (create, delete, edit, publish?)
- [ ] Confirm VportAdsBackButton destination route
