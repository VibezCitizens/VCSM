---
title: Dashboard Shell Module — Index
status: ACTIVE
feature: dashboard
module: dashboard
source: SOURCE_VERIFIED
owner: ARCHITECT
last-rebuilt: 2026-06-05
ticket: TICKET-ARCHITECT-MODULE-0001
scanner-version: 1.1.0
---

# dashboard / modules / dashboard (shell)

Dashboard shell module. Owns the top-level VportDashboardScreen, the VPORT ownership gate, card catalog model, card grid layout, and imperative navigation to all card sub-modules.

## Module Summary

| Field | Value | Source |
|---|---|---|
| Module | dashboard (shell) | SOURCE_VERIFIED |
| Feature | dashboard | SOURCE_VERIFIED |
| Source Path | apps/VCSM/src/features/dashboard/vport/ | SOURCE_VERIFIED |
| Primary Screen | VportDashboardScreen | SOURCE_VERIFIED — VportDashboardScreen.jsx line 21 |
| Primary Route | /actor/:actorId/dashboard | SOURCE_VERIFIED — useParams line 23 |
| Route Scanner Coverage | NONE — routing is imperative (useNavigate) | SOURCE_VERIFIED |
| Architecture State | MOSTLY COMPLETE | ARCHITECT 2026-06-05 |
| Write Surfaces | 0 (shell dispatches navigation only) | SOURCE_VERIFIED |
| Independence | MOSTLY INDEPENDENT | ARCHITECT 2026-06-05 |

---

## FEATURE_INDEX_RUNTIME

| Layer | Count | Key Files | Source |
|---|---|---|---|
| Screens | 1 | VportDashboardScreen.jsx | SOURCE_VERIFIED |
| Components | 2 | DashboardCard, VportBannerHeader (VportDashboardParts.jsx) | SOURCE_VERIFIED |
| Styles | 1 | vportDashboardShellStyles.js | SOURCE_VERIFIED |
| Hooks | 2 | useVportOwnership.js, useOwnerQuickStats.js | SOURCE_VERIFIED |
| Controllers | 2 | checkVportOwnership.controller.js, vportOwnerStats.controller.js | SOURCE_VERIFIED |
| Models | 3 | buildDashboardCards.model.js, dashboardViewByVportType.model.js, dashboardVportDetails.model.js | SOURCE_VERIFIED |
| DAL (delegated) | 11 | vport/dal/read/ (read-only) | SOURCE_VERIFIED — vportOwnerStats.controller.js lines 1-6 |
| Barrel (legacy) | 3 | screens/model/ re-export shims — MARK LEGACY | SOURCE_VERIFIED |
| Routes | 0 | /actor/:actorId/dashboard not in scanner route-map | SOURCE_VERIFIED |
| Mutation surfaces | 0 | No writes in shell module | SOURCE_VERIFIED |
| Engine dependencies | 2 (shell-direct) | identity (state), profiles (adapter) | SOURCE_VERIFIED |
| Tests | 0 | No shell-scope tests exist | scanner test-map |
| Card types defined | 17 | CARD_CATALOG in buildDashboardCards.model.js | SOURCE_VERIFIED |
| Dashboard view presets | 8 | DASHBOARD_VIEW_PRESETS in dashboardViewByVportType.model.js | SOURCE_VERIFIED |

---

## Navigation Dispatch (Source Verified)

All navigation from the shell is imperative via `useNavigate`. No routes are registered in the dashboard feature itself.

| Handler | Target Route | Source |
|---|---|---|
| openQr | /profile/:slug/menu/qr or /actor/:actorId/menu/qr | VportDashboardScreen.jsx line 50-55 |
| openFlyer | /actor/:actorId/menu/flyer[?variant=table] | line 56-61 |
| openFlyerEditor | /actor/:actorId/menu/flyer/edit | line 62 |
| openOnlineMenuPreview | /profile/:slug/menu or /actor/:actorId/menu | line 63-68 |
| openExchangeRates | /actor/:actorId/dashboard/exchange | line 69 |
| openServices | /actor/:actorId/dashboard/services | line 70 |
| openReviews | /actor/:actorId/dashboard/reviews | line 71 |
| openLeads | /actor/:actorId/dashboard/leads | line 72 |
| openReviewsQr | /profile/:slug/reviews/qr or /actor/:actorId/reviews/qr | line 73-78 |
| openTeam | /actor/:actorId/dashboard/team | line 79 |
| openCalendar | /actor/:actorId/dashboard/calendar | line 80 |
| openPortfolio | /actor/:actorId/dashboard/portfolio | line 81 |
| openBookingHistory | /actor/:actorId/dashboard/booking-history | line 82 |
| openLocksmith | /actor/:actorId/dashboard/locksmith | line 83 |
| openGasPrices | /actor/:actorId/dashboard/gas | line 84 |
| openAdsPipeline | /ads/vport/:actorId | line 85 |
| openSettings | /actor/:actorId/settings | line 86 |

---

## Cross-Feature Dependencies

| Dependency | Type | Via | Status |
|---|---|---|---|
| @/state/identity/identityContext | Global state | Direct — approved global path | CLEAN |
| @/features/profiles/adapters/* | Feature | Adapter boundary ✓ | CLEAN |
| @/features/booking/adapters/booking.adapter | Feature | Adapter boundary PARTIAL ⚠ (ARCH-001: exports DAL) | WARNING |
| @/shared/hooks/useDesktopBreakpoint | Shared | Direct — shared approved | CLEAN |
| @/shared/components/Skeleton | Shared | Direct — shared approved | CLEAN |
| @/shared/config/releaseFlags | Shared | Direct — shared approved | CLEAN |

---

## Governance Files

| File | Status | Last Updated |
|---|---|---|
| ARCHITECTURE.md | ACTIVE | 2026-06-05 (this run) |
| INDEX.md | ACTIVE | 2026-06-05 (this run) |
| BEHAVIOR.md | ACTIVE | 2026-06-05 (this run) |
| SECURITY.md | STUB — VENOM/ELEKTRA required | 2026-06-05 (created) |

---

## Architectural Findings Summary

| ID | Severity | Summary |
|---|---|---|
| ARCH-001 | MEDIUM | booking.adapter exports getActorByIdDAL — adapter boundary violation |
| ARCH-002 | LOW | screens/model/ shims are legacy residue |
| ARCH-003 | MEDIUM | Route not in scanner — auth guard unconfirmed |
| ARCH-004 | INFO | useIdentity direct state import — approved |
| ARCH-005 | LOW | vportBookingHistoryView.model.js scope belongs to bookings module |

Full report: `outputs/2026/06/05/ARCHITECT/vcsm.dashboard.shell.architecture.md`
