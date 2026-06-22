---
title: Settings Module — Index
status: STUB
feature: ads
module: settings
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/ads/
scanner-version: 1.1.0
---

# ads / modules / settings

Settings UI layer for the ads feature. Owns the VPORT ads settings screen, the main lifecycle hook, and all UI components for the ad pipeline editor. actorId sourced from URL params with no ownership verification — THOR risk pre-migration.

## Module Summary

| Field | Value |
|---|---|
| Module | settings |
| Feature | ads |
| Source Path | apps/VCSM/src/features/ads/ |
| Screens | 1 (VportAdsSettingsScreen.jsx) |
| Routes | 0 confirmed (route registered but not in route-map scanner — HAWKEYE needed) |
| Write Surfaces | localStorage only (via pipeline module) |
| Hooks | 2 |
| UI Components | 3 files |
| Models | 1 |
| Adapters | 1 |

## Known Source Files (ARCHITECT-verified)

### Screens
| File | Role | Security Flag |
|---|---|---|
| screens/VportAdsSettingsScreen.jsx | VPORT ads management screen | actorId from useParams() — no ownership verification (VEN-ADS-001/002) |
| screens/adsScreens.js | Screen barrel | — |

### Hooks
| File | Role |
|---|---|
| hooks/useVportAds.js | Main ads lifecycle hook — manages ad list, draft creation, deletion |
| hooks/useDesktopBreakpoint.js | Responsive breakpoint hook |

### UI Components
| File | Role |
|---|---|
| ui/adsPipeline.ui.js | AdEditor, AdsList, AdsEmptyState |
| ui/VportAdsBackButton.jsx | Back navigation button |
| ui/components.jsx | Shared UI components |

### Models
| File | Role |
|---|---|
| model/vportAdsSettingsShell.model.js | Shell model for settings screen state |

### Adapters
| File | Role |
|---|---|
| adapters/hooks/useVportAds.adapter.js | Public hook adapter for external consumption |

## Security Flags

- HIGH (pre-migration CRITICAL): VEN-ADS-001 / BW-ADS-001 — route /ads/vport/:actorId not nested inside OwnerOnlyDashboardGuard; any authenticated Citizen can load another actor's ad pipeline
- HIGH (pre-migration CRITICAL): VEN-ADS-002 / BW-ADS-002 — actorId resolved from URL param with no session cross-check; foreign actorId accepted
- MEDIUM: BW-ADS-003 — no actor kind check; user-kind actor can access VPORT-only ads pipeline
- LOW: BW-ADS-007 — raw actorId UUID exposed in route path /ads/vport/:actorId (platform no-raw-IDs-in-URLs violation)

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm route path — /ads/vport/:actorId or different pattern?
- [ ] Confirm whether route is behind OwnerOnlyDashboardGuard in router config
- [ ] Confirm useVportAds.js actorId source — URL param, Zustand store, or both?
- [ ] Confirm actor kind check — is there any VPORT-only gate in screen or hook?
