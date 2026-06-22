---
name: hawkeye-route-audit
description: WOLVERINE Phase 2 — HAWKEYE dashboard route audit. Root cause of 0-route scanner gap. Full route map with guard analysis.
metadata:
  type: route-audit
  command: HAWKEYE
  phase: WOLVERINE Phase 2
  ticket: TICKET-DASH-WOLVERINE-001
  date: 2026-06-05
  scope: dashboard feature routes
---

# HAWKEYE — Dashboard Route Audit
## WOLVERINE Phase 2 | TICKET-DASH-WOLVERINE-001 | 2026-06-05

**Trigger:** ARCHITECT scanner reported 0 routes for dashboard despite 16+ navigable paths.
**Purpose:** Locate all registered routes, map guard chains, identify contract gaps.

---

## Root Cause: Scanner 0-Route Gap

**Finding:** All dashboard routes are defined inside factory functions, not as top-level declarations.

```js
// app.routes.jsx
export function protectedAppRoutes({ VportDashboardScreen, ... }) {
  return [
    { path: "/actor/:actorId/dashboard", element: <VportDashboardScreen /> },
    ...
  ]
}
```

```js
// vportMenu.routes.jsx
export function vportMenuPublicRoutes({ VportActorMenuQrScreen, ... }) {
  return [
    { path: "/actor/:actorId/menu/qr", element: <VportActorMenuQrScreen /> },
    ...
  ]
}
```

The static scanner looks for `path:` declarations at module scope. Factory function calls are not
evaluated during static analysis, so the scanner captures 0 routes.

**This is a scanner limitation, NOT a missing route.** All 14 protected dashboard routes are
correctly registered. The factory pattern is used to support lazy-loaded component injection.

**HAWKEYE-FINDING-001 (INFO):** Scanner 0-route gap explained. No missing route registration.
Recommendation: update the scanner to extract routes from return statements inside exported functions.

---

## Complete Route Map

### Protected Dashboard Routes
**Guard chain:** ProtectedRoute → ProfileGatedOutlet → BlockedVportGuard → OwnerOnlyDashboardGuard

| # | Path | Screen | Lazy Source | Guard |
|---|------|--------|------------|-------|
| 1 | `/actor/:actorId/dashboard` | VportDashboardScreen | `dashboard/vport/screens/VportDashboardScreen` | Full chain |
| 2 | `/actor/:actorId/dashboard/gas` | VportDashboardGasScreen | `dashboard/cards/gasprices/screens/VportDashboardGasScreen` | Full chain |
| 3 | `/actor/:actorId/dashboard/reviews` | VportDashboardReviewScreen | `dashboard/cards/reviews/VportDashboardReviewScreen` | Full chain |
| 4 | `/actor/:actorId/dashboard/leads` | VportDashboardLeadsScreen | `dashboard/cards/leads/VportDashboardLeadsScreen` | Full chain |
| 5 | `/actor/:actorId/dashboard/services` | VportDashboardServicesScreen | `dashboard/cards/services/VportDashboardServicesScreen` | Full chain |
| 6 | `/actor/:actorId/dashboard/exchange` | VportDashboardExchangeScreen | `dashboard/cards/exchange/VportDashboardExchangeScreen` | Full chain |
| 7 | `/actor/:actorId/dashboard/calendar` | VportDashboardCalendarScreen | `dashboard/cards/calendar/VportDashboardCalendarScreen` | Full chain |
| 8 | `/actor/:actorId/dashboard/portfolio` | VportDashboardPortfolioScreen | `dashboard/cards/portfolio/VportDashboardPortfolioScreen` | Full chain |
| 9 | `/actor/:actorId/dashboard/locksmith` | VportDashboardLocksmithScreen | `dashboard/cards/locksmith/VportDashboardLocksmithScreen` | Full chain |
| 10 | `/actor/:actorId/dashboard/booking-history` | VportDashboardBookingHistoryScreen | `dashboard/cards/bookings/VportDashboardBookingHistoryScreen` | Full chain |
| 11 | `/actor/:actorId/dashboard/team` | VportDashboardTeamScreen | `dashboard/cards/team/VportDashboardTeamScreen` | Full chain |
| 12 | `/actor/:actorId/dashboard/team-requests` | BarberTeamRequestsScreen | `dashboard/cards/team/BarberTeamRequestsScreen` | Full chain |
| 13 | `/actor/:actorId/dashboard/schedule` | VportDashboardScheduleScreen | `dashboard/cards/schedule/VportDashboardScheduleScreen` | Full chain |
| 14 | `/actor/:actorId/settings` | VportSettingsScreen | `dashboard/cards/settings/VportSettingsFinalScreen` | Full chain |

All 14 routes share the same guard chain: BlockedVportGuard → OwnerOnlyDashboardGuard.

### Release-Flagged Protected Routes
**Guard chain:** ProtectedRoute → ProfileGatedOutlet (NOT in BlockedVportGuard/OwnerOnlyDashboardGuard)

| # | Path | Screen | Flag | Auth Guard |
|---|------|--------|------|-----------|
| 15 | `/actor/:actorId/menu/flyer/edit` | VportActorMenuFlyerEditorScreen | releaseFlags.vportFlyerEditor | ProtectedRoute only |

**HAWKEYE-FINDING-002 (MEDIUM — supports VEN-CARD-001):**
The flyer editor is NOT inside `OwnerOnlyDashboardGuard`. The route layer only enforces authentication.
Ownership verification is delegated entirely to the controller layer (`requireOwnerActorAccess` inside
`saveFlyerPublicDetailsCtrl`, `ctrlUploadDesignAsset`, etc.).

Combined with VEN-CARD-001 (`uploadFlyerImageCtrl` has no ownership check), the route+controller chain
for flyer image upload has zero ownership enforcement at any layer. Any authenticated user who knows a
VPORT actorId can POST an upload to that VPORT's design_asset scope.

This reinforces VEN-CARD-001 as a HIGH THOR BLOCKER.

### Public Routes (no authentication required)

| # | Path | Screen | Note |
|---|------|--------|------|
| 16 | `/actor/:actorId/menu` | VportActorMenuPublicScreen | Public — by design |
| 17 | `/actor/:actorId/menu/qr` | VportActorMenuQrScreen | Public — QR code viewer |
| 18 | `/actor/:actorId/menu/flyer` | VportActorMenuFlyerScreen | Public (releaseFlags.vportPrintableFlyer) |
| 19 | `/m/:actorId` | VportMenuRedirectScreen | Public legacy entry |
| 20 | `/profile/:slug/menu` | VportMenuBySlugScreen | Canonical slug — public |
| 21 | `/profile/:slug/menu/qr` | VportMenuQrBySlugScreen | Canonical slug — public |
| 22 | `/profile/:slug/reviews` | VportReviewsBySlugScreen | Canonical slug — public |
| 23 | `/profile/:slug/reviews/qr` | VportReviewsQrBySlugScreen | Canonical slug — public |

**Note:** Routes #17–18 (`/actor/:actorId/menu/qr` and `/actor/:actorId/menu/flyer`) are intentionally
public. They render the publicly-accessible VPORT menu — this is correct. These were not the target
of the missing-route concern. The flyer VIEW is public; the flyer EDITOR (#15) is auth-gated.

### Legacy Redirect Routes (/vport/* → /actor/*)

| Path | Redirect Target |
|------|----------------|
| `/vport/:actorId/dashboard` | `/actor/:actorId/dashboard` |
| `/vport/:actorId/dashboard/reviews` | `/actor/:actorId/dashboard/reviews` |
| `/vport/:actorId/dashboard/leads` | `/actor/:actorId/dashboard/leads` |
| `/vport/:actorId/dashboard/exchange` | `/actor/:actorId/dashboard/exchange` |
| `/vport/:actorId/dashboard/calendar` | `/actor/:actorId/dashboard/calendar` |
| `/vport/:actorId/menu/qr` | `/actor/:actorId/menu/qr` |
| `/vport/:actorId/menu/flyer` | `/actor/:actorId/menu/flyer` |
| `/vport/:actorId/menu/flyer/edit` | `/actor/:actorId/menu/flyer/edit` |
| `/vport/:actorId/settings` | `/actor/:actorId/settings` |
| `/vport/:actorId/ads` | `/actor/:actorId/ads` |

**HAWKEYE-FINDING-003 (INFO):** Partial redirect coverage. The following dashboard sub-routes
have no `/vport/*` legacy redirect:
- `/vport/:actorId/dashboard/gas`
- `/vport/:actorId/dashboard/portfolio`
- `/vport/:actorId/dashboard/team`
- `/vport/:actorId/dashboard/services`
- `/vport/:actorId/dashboard/schedule`
- `/vport/:actorId/dashboard/booking-history`
- `/vport/:actorId/dashboard/locksmith`
- `/vport/:actorId/dashboard/team-requests`

Old `/vport/*` links to these sub-routes will hit the catch-all (`Navigate to="/feed"`).
These cards were likely added after the `/actor/*` migration. No user-facing links expected
to these legacy paths — low risk. Advisory only.

---

## Guard Chain Analysis

### OwnerOnlyDashboardGuard Scope

All 14 dashboard routes are correctly wrapped inside `OwnerOnlyDashboardGuard` via nested route:
```
element: <BlockedVportGuard />
  children:
    element: <OwnerOnlyDashboardGuard />
      children: [14 dashboard routes]
```

This is correct. `OwnerOnlyDashboardGuard` runs before any dashboard screen mounts.
Per VENOM documentation, `OwnerOnlyDashboardGuard` is self-documented as "UI convenience only —
not the authoritative security boundary." Controller-layer enforcement is required (and confirmed
for 13 of 14 routes per ARCHITECT card audit).

### Routes Outside the Guard Chain

`/actor/:actorId/menu/flyer/edit` sits outside `BlockedVportGuard` and `OwnerOnlyDashboardGuard`.
This is architecturally distinct from the dashboard — it is a flyer editing surface accessible
directly by URL. Guard responsibility falls to the controller layer only.

---

## Contract Gap Summary

| Finding | Severity | Type | Description |
|---------|----------|------|-------------|
| HAWKEYE-FINDING-001 | INFO | Scanner | 0-route gap is a scanner limitation (factory function pattern), not missing routes |
| HAWKEYE-FINDING-002 | MEDIUM | Security | Flyer editor route has no route-level ownership guard; controller-only enforcement; compounded by VEN-CARD-001 |
| HAWKEYE-FINDING-003 | INFO | Coverage | 8 dashboard sub-routes have no /vport/* legacy redirect |

**Total routes mapped:** 33 (14 protected dashboard + 1 release-flagged editor + 8 public + 10 legacy redirects)
**Scanner gap resolved:** Yes — factory function limitation, all routes confirmed registered
**THOR impact:** HAWKEYE-FINDING-002 reinforces VEN-CARD-001 (existing HIGH blocker); no new THOR blockers added

---

## SCREENS.md Update Required

Current SCREENS.md should be updated to reflect:
- All 14 protected dashboard routes with guard chain documentation
- `/actor/:actorId/menu/flyer/edit` — auth-only, outside guard chain
- Public menu routes documented as intentionally unauthenticated
- Scanner gap explanation appended to ARCHITECTURE.md §routes section
