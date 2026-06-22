---
title: Settings Module — Architecture
status: STUB
feature: ads
module: settings
source: architect-derived
created: 2026-06-05
---

# ads / modules / settings — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review. Full trace pending.

## Layer Stack

```
Route /ads/vport/:actorId
  └── VportAdsSettingsScreen.jsx (screen)
        ├── useDesktopBreakpoint.js (responsive)
        ├── useVportAds.js (main lifecycle hook — reads actorId from URL params)
        │     └── adapters/hooks/useVportAds.adapter.js (adapter — may be bypassed)
        │           └── adPipeline.usecase.js (pipeline module)
        └── UI Components
              ├── ui/adsPipeline.ui.js (AdEditor, AdsList, AdsEmptyState)
              ├── ui/VportAdsBackButton.jsx (back nav)
              └── ui/components.jsx (shared UI)
```

## Route Guard Gap

```
Expected:
  OwnerOnlyDashboardGuard
    └── Route /ads/vport/:actorId
          └── VportAdsSettingsScreen.jsx

Actual (UNVERIFIED — ARCHITECT suspected):
  Route /ads/vport/:actorId   ← no guard
    └── VportAdsSettingsScreen.jsx
```

VEN-ADS-001 / BW-ADS-001: Route is not inside OwnerOnlyDashboardGuard. Ownership check never fires.

## actorId Resolution Gap

```
useParams() → actorId (from URL)
  ↓ (no session cross-check)
useVportAds(actorId)
  ↓
ad.storage.dal.js listAdsByActor(actorId)
  ↓
localStorage.getItem(ADS_STORAGE_KEY)  ← global, not per-actorId (VEN-ADS-003)
```

## Module Boundaries

| Boundary | Owner | Status |
|---|---|---|
| Route | /ads/vport/:actorId | UNGUARDED (VEN-ADS-001) |
| Screen | VportAdsSettingsScreen.jsx | OK |
| actorId source | useParams() | INSECURE (VEN-ADS-002) |
| Hook lifecycle | useVportAds.js | OK |
| Adapter | useVportAds.adapter.js | UNVERIFIED — may be bypassed |

## TODO

- [ ] Confirm router config — is /ads/vport/:actorId inside OwnerOnlyDashboardGuard?
- [ ] Confirm whether VportAdsSettingsScreen.jsx reads actorId from useParams or from Zustand identity store
- [ ] Confirm useVportAds.adapter.js is the actual call path (not direct hook import)
- [ ] Confirm vportAdsSettingsShell.model.js role in the settings screen
