---
title: Dashboard Shell Behavior Reverse Engineering Report
ticket: TICKET-ARCHITECT-BEHAVIOR-REVERSE-0001
command: ARCHITECT
module: dashboard (shell)
feature: dashboard
generated: 2026-06-05
---

# DASHBOARD SHELL BEHAVIOR REVERSE ENGINEERING REPORT

**Ticket:** TICKET-ARCHITECT-BEHAVIOR-REVERSE-0001
**Module:** dashboard / modules / dashboard (shell)
**Date:** 2026-06-05

---

## 1. Files Read

### Governance Files

| File | Status | Used For |
|---|---|---|
| ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/INDEX.md | ACTIVE | Module summary, layer counts, navigation dispatch map |
| ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/ARCHITECTURE.md | ACTIVE | Call graph, render guards, card catalog, view presets |
| ZZnotforproduction/APPS/VCSM/features/dashboard/INDEX.md | ACTIVE | Feature-level write surface map, routes, engine dependencies |
| ZZnotforproduction/APPS/VCSM/features/dashboard/ARCHITECTURE.md | ACTIVE | Feature-level module completeness, dependency graph, entry points |
| ZZnotforproduction/APPS/VCSM/features/dashboard/SCREENS.md | ACTIVE | Scanner-derived screen list, route-linked screens, access classification |
| ZZnotforproduction/APPS/VCSM/features/dashboard/CURRENT_STATUS.md | ACTIVE | ARCHITECT last-run state and top governance gap |

### Source Files

| File | Used For |
|---|---|
| apps/VCSM/src/features/dashboard/vport/screens/VportDashboardScreen.jsx | Primary screen — full behavior extraction |
| apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js | Ownership hook — state init, async check, re-verify |
| apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js | Ownership controller — self-access bypass, actor_owners check |
| apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js | Quick stats controller — data contract |
| apps/VCSM/src/features/dashboard/vport/model/buildDashboardCards.model.js | Card catalog — 17 cards, builder logic, locked condition |
| apps/VCSM/src/features/dashboard/vport/model/dashboardViewByVportType.model.js | View presets — 8 presets, type-to-view resolution, calendar injection |
| apps/VCSM/src/features/dashboard/vport/model/dashboardVportDetails.model.js | VPORT details normalizer |
| apps/VCSM/src/app/routes/protected/app.routes.jsx | Route registration — guard wrapping structure |
| apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx | OwnerOnlyDashboardGuard + BlockedVportGuard source |
| apps/VCSM/src/features/booking/adapters/booking.adapter.js | Adapter boundary — approved exception |

### Scanner Maps Used

| Map | Generated At | Used For |
|---|---|---|
| apps/scanner/maps/feature-map.json | 2026-06-05T03:29:11Z | Feature layer counts |
| apps/scanner/maps/route-map.json | 2026-06-05T03:29:11Z | Dashboard route access classification |
| apps/scanner/maps/screen-map.json (SCREENS.md) | 2026-06-05T03:29:11Z | Route-linked screens list |

---

## 2. Key Discovery — Previously Undocumented Route Guards

**CRITICAL:** During source reading, two route-level guards were discovered wrapping ALL dashboard routes that were NOT documented in the existing VENOM, BLACKWIDOW, or ARCHITECT reports.

**Guard:** `OwnerOnlyDashboardGuard`
- File: `apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx:23-34`
- Enforces: `String(identity.actorId) === String(actorId)` (URL match)
- Action on mismatch: `<Navigate to="/feed" replace />`
- Action on identityLoading: returns null (wait)
- Action on !identity: redirect to /feed
- Self-documented as "UI convenience only — not the authoritative security boundary"
- Applies to: ALL `/actor/:actorId/dashboard/*` routes and `/actor/:actorId/settings`

**Guard:** `BlockedVportGuard`
- File: `apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx:36-42`
- Enforces: `!blockedVport`
- Action on blockedVport=true: `<Navigate to="/vport/restore" replace />`

**Full Route Guard Chain Confirmed:**
```
ProtectedRoute (auth + email + consent)
  → ProfileGatedOutlet (profile completeness)
    → BlockedVportGuard (VPORT blocked status)
      → OwnerOnlyDashboardGuard (identity.actorId === URL actorId)
        → VportDashboardScreen (useVportOwnership — additional screen-level check)
```

Previous documentation (VENOM, BLACKWIDOW) only recorded ProtectedRoute + ProfileGatedOutlet. BlockedVportGuard and OwnerOnlyDashboardGuard were missing.

---

## 3. Behaviors Found

### Route Entry
- Route: `/actor/:actorId/dashboard`
- Component: `VportDashboardScreen`
- Param: `actorId` — VPORT actor UUID from URL
- Guard chain: 4 layers before screen renders (see above)
- Scanner access classification: "public" — but scanner does not detect the guard chain correctly
- Actual access: OWNER ONLY (guarded by OwnerOnlyDashboardGuard at route level)

### Identity Behavior
- Session actor read from: `useIdentity()` → `identityContext` (Supabase session-populated)
- `identity.actorId` — currently active actor ID (switches when user enters VPORT mode)
- `identity.vportType` — VPORT type classification used for card preset selection
- URL `actorId` — resource identifier, read from `useParams()`

### Ownership Check Behavior
- OwnerOnlyDashboardGuard: synchronous `identity.actorId === actorId` check at route level
- `useVportOwnership(callerActorId, targetActorId)` — async check at screen level
- `checkVportOwnershipController` — resolves via:
  - Self-access path: `callerActorId === targetActorId && actor.kind === 'vport' && !actor.is_void`
  - Owner path: `assertActorOwnsVportActorController({ requestActorId, targetActorId })` → `actor_owners` table

### Card Catalog Behavior
- 17 cards in `CARD_CATALOG`
- Card set filtered by VPORT type via `getDashboardViewByVportType(vportType, { getTabsFn })`
- 8 view presets: default, service, barber, barbershop, locksmith, food, gas, exchange
- Type-to-view override: barber, barbershop, locksmith, gas station, exchange
- Group-to-view fallback: resolves normalized VPORT type → industry group → view preset
- Calendar card injected dynamically if VPORT type has "book" tab (`withCalendarCardIfVportHasBookingTab`)
- Release flags applied via `isDashboardCardEnabled(key)` (`withVisibleCardKeys`)
- Cards with `getLocked`: flyer, flyer_edit locked when `!isDesktop`

### Navigation Dispatch Behavior
- All navigation is imperative via `useNavigate`
- Slug-preferring routes: QR → `/profile/:slug/menu/qr` else `/actor/:actorId/menu/qr`
- Slug-preferring routes: Reviews QR → `/profile/:slug/reviews/qr` else `/actor/:actorId/reviews/qr`
- Slug-preferring routes: Menu Preview → `/profile/:slug/menu` else `/actor/:actorId/menu`
- Direct card routes: all others use `/actor/:actorId/dashboard/[card]`
- Settings: `/actor/:actorId/settings`
- Ads pipeline: `/ads/vport/:actorId`
- Flyer variant: `/actor/:actorId/menu/flyer?variant=table` for restaurant type

### Data Read Behavior
- Shell reads: public VPORT profile (`useVportDashboardDetails(actorId)` via profiles.adapter)
- Shell reads: identity from `useIdentity()` (global context, not an async DAL call)
- Shell reads: VPORT tabs config via `useProfilesOps().getVportTabsByType` (for calendar card injection)
- Shell reads: release flags via `isDashboardCardEnabled` (synchronous, no async)
- Quick stats (`useOwnerQuickStats`, `vportOwnerStats.controller.js`): present in shell module directory but NOT called from `VportDashboardScreen.jsx`

### Desktop/Portal Behavior
- `isDesktop` from `useDesktopBreakpoint()`
- When `isDesktop && typeof document !== 'undefined'`: renders via `createPortal` to `document.body` as fixed full-screen overlay (`position: fixed`, `z-index: 9999`)
- Reason: iOS stacking context workaround — avoids `position:fixed` rendering inside parent containers with backdrop-filter, transform, or overflow:hidden

### Legacy Redirect Routes
- `/vport/:actorId/dashboard` → redirects to `/actor/:actorId/dashboard` (VportToActorDashboardRedirect)
- Similar redirect routes for reviews, leads, exchange, calendar, settings

---

## 4. Behaviors Left UNKNOWN

| Behavior | Reason |
|---|---|
| `useOwnerQuickStats` consumer | Hook exists in module directory but not called from VportDashboardScreen.jsx — consumer unknown |
| `blockedVport` field semantics | `BlockedVportGuard` checks `identity.blockedVport` — exact field definition and when it becomes true not traced to source |
| `useVportDashboardDetails` internals | Called via deep profiles adapter path; internals not in shell scope |
| QR card sub-module slug encoding | The shell navigates to the QR page; what URL the QR code encodes is outside shell scope |
| Release flag values | `isDashboardCardEnabled` is synchronous but flag values from `@/shared/config/releaseFlags` not read in this run |

---

## 5. Evidence Classification Counts

| Classification | Count |
|---|---|
| [SOURCE_VERIFIED] | 47 |
| [SCANNER_VERIFIED] | 6 |
| [ARCHITECT_VERIFIED] | 12 |
| [UNKNOWN] | 5 |

---

## 6. BEHAVIOR.md Transition

| Before | After |
|---|---|
| STUB (placeholder) | ACTIVE — full behavior contract |

The existing BEHAVIOR.md from the 2026-06-05 ARCHITECT run contained §1 through §8 based on partial source verification. This run replaces it with a fully structured contract conforming to the required format, with two major additions:
1. The complete 4-layer guard chain (BlockedVportGuard and OwnerOnlyDashboardGuard newly discovered)
2. Formal §5 through §14 sections per the required BEHAVIOR.md contract format

---

## 7. Notes on Scanner Classification Discrepancy

The scanner classifies all `/actor/:actorId/dashboard/*` routes as `"access": "public"`. This is incorrect — the routes are behind a 4-layer guard chain. The scanner does not analyze React component wrapper guards; it only detects static access attributes. HAWKEYE verification is required to formally update route access classification.
