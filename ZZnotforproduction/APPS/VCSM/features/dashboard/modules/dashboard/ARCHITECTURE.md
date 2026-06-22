---
title: Dashboard Shell Module — Architecture
status: ACTIVE
feature: dashboard
module: dashboard
source: SOURCE_VERIFIED
owner: ARCHITECT
last-run: 2026-06-05
ticket: TICKET-ARCHITECT-MODULE-0001
scanner-version: 1.1.0
independence: MOSTLY INDEPENDENT
completeness: MOSTLY COMPLETE
---

# dashboard / modules / dashboard — ARCHITECTURE

**Architecture State:** STABLE
**Last ARCHITECT Run:** 2026-06-05 (TICKET-ARCHITECT-MODULE-0001)
**Scanner Version:** 1.1.0

---

## Purpose

The dashboard shell module is the entry container for the VPORT owner control center.

It is responsible for exactly three things:
1. **Ownership gate** — verify the requesting actor owns the target VPORT before any dashboard content renders
2. **Card catalog dispatch** — build and render the correct set of dashboard cards based on VPORT type
3. **Imperative navigation** — dispatch the actor to the appropriate card sub-module via `useNavigate`

The shell owns no write surfaces. All mutations are delegated to card sub-modules.

---

## Ownership

| Field | Value |
|---|---|
| App | VCSM |
| Feature | dashboard |
| Module | dashboard (shell) |
| Primary screen | VportDashboardScreen |
| Source path | apps/VCSM/src/features/dashboard/vport/ (shell files) |
| Module owner | VCSM:dashboard |
| Cross-feature consumers | None — shell is an entry point |

---

## Entry Points

| Entry | Path | Source | Auth |
|---|---|---|---|
| `/actor/:actorId/dashboard` | VportDashboardScreen.jsx | SOURCE_VERIFIED — useParams line 23 | Ownership gate (useVportOwnership) |

Note: Route registration is not captured by the scanner route-map. The route exists in the VCSM main router (not scanner-indexed). HAWKEYE verification required for auth guard confirmation.

---

## Layer Map

| Layer | Files | Key Exports | Notes |
|---|---|---|---|
| Screen | VportDashboardScreen.jsx | VportDashboardScreen | Primary entry; ownership-gated; portal on desktop |
| Component | VportDashboardParts.jsx | DashboardCard, VportBannerHeader | Card grid and banner components |
| Style | vportDashboardShellStyles.js | createVportDashboardShellStyles | Shell layout — uses `--vc-*` CSS properties |
| Hook | useVportOwnership.js | useVportOwnership | Async ownership check + focus/visibility re-verify |
| Hook | useOwnerQuickStats.js | useOwnerQuickStats | Owner booking stats (not consumed by shell screen directly) |
| Controller | checkVportOwnership.controller.js | checkVportOwnershipController | Actor ownership resolution via actor_owners |
| Controller | vportOwnerStats.controller.js | loadOwnerQuickStatsController | Reads today/upcoming bookings + staff count |
| Model | buildDashboardCards.model.js | buildDashboardCards, getDashboardCardMetaByKey | 17-card CARD_CATALOG + builder |
| Model | dashboardViewByVportType.model.js | getDashboardViewByVportType, normalizeVportType | 8 preset views; type → view resolution |
| Model | dashboardVportDetails.model.js | normalizeDashboardVportDetails | VPORT public details normalizer |
| DAL (delegated) | vport/dal/read/ (11 files) | vportProfile, listVportBookings, vportResource, etc. | Read-only; consumed by controllers |
| Barrel (legacy) | screens/model/*.model.js (3 files) | Re-exports from canonical vport/model/ | Compatibility shims — MARK LEGACY |

---

## Call Graph (Source Verified)

```
VportDashboardScreen [screen]
  ├─ useIdentity() → @/state/identity/identityContext [GLOBAL STATE]
  ├─ useVportDashboardDetails(actorId) → profiles.adapter [CROSS-FEATURE via adapter ✓]
  ├─ normalizeDashboardVportDetails() → dashboardVportDetails.model.js
  ├─ useDesktopBreakpoint() → @/shared/hooks [SHARED]
  ├─ useVportOwnership(callerActorId, actorId) → useVportOwnership.js
  │    └─ checkVportOwnershipController({ callerActorId, targetActorId })
  │         ├─ SELF-ACCESS: getActorByIdDAL() [via booking.adapter ⚠ ARCH-001]
  │         └─ assertActorOwnsVportActorController() [via booking.adapter ✓]
  ├─ useProfilesOps() → profiles.adapter [CROSS-FEATURE via adapter ✓]
  ├─ getDashboardViewByVportType(vportType) → dashboardViewByVportType.model.js
  │    └─ withVisibleCardKeys() → isDashboardCardEnabled [releaseFlags ✓]
  ├─ buildDashboardCards({ handlers, vportType }) → buildDashboardCards.model.js
  │    └─ getDashboardCardKeysByVportType() → dashboardViewByVportType.model.js
  └─ [RENDER]
       ├─ VportBackButton → dashboard/shared/components/BackButton [INTERNAL ✓]
       ├─ VportBannerHeader → VportDashboardParts.jsx
       ├─ DashboardCard × N → VportDashboardParts.jsx
       └─ createPortal (desktop) → document.body [iOS stacking context workaround ✓]
```

---

## Render Guards (Source Verified)

| Guard | Condition | Behavior |
|---|---|---|
| No actorId | `!actorId` | Returns null |
| Loading | `identityLoading \|\| ownershipLoading` | SkeletonCardList |
| Not authenticated | `!identity` | "Sign in required" message |
| Not owner | `!isOwner` | "You can only access the dashboard for your own vport" |

---

## Dashboard Card Catalog (Source Verified)

17 card types defined in CARD_CATALOG:

| Card Key | Title | Locked Condition |
|---|---|---|
| qr | Menu QR | Never |
| flyer | Printable Flyer | !isDesktop |
| flyer_edit | Edit Flyer | !isDesktop |
| menu_preview | Preview Online Menu | Never |
| exchange | Exchange Rates | Never |
| team | Team | Never |
| portfolio | Portfolio | Never |
| locksmith | Locksmith Manager | Never |
| services | Services | Never |
| reviews | Reviews | Never |
| leads | Leads | Never |
| reviews_qr | Reviews QR | Never |
| booking_history | Bookings | Never |
| calendar | Calendar & Slots | Never |
| gas | Gas Prices | Never |
| ads | Ads Pipeline | Never |
| settings | Settings | Never |

---

## Dashboard View Presets (Source Verified)

8 presets in DASHBOARD_VIEW_PRESETS. Type-to-preset resolution:

| VPORT Type | Preset | Source |
|---|---|---|
| barber | barber | TYPE_TO_VIEW override |
| barbershop | barbershop | TYPE_TO_VIEW override |
| locksmith | locksmith | TYPE_TO_VIEW override |
| gas station | gas | TYPE_TO_VIEW override |
| exchange | exchange | TYPE_TO_VIEW override |
| Beauty & Wellness group | service | GROUP_TO_VIEW |
| Food, Hospitality & Events group | food | GROUP_TO_VIEW |
| Gas & Fuel group | gas | GROUP_TO_VIEW |
| All other groups | default or service | GROUP_TO_VIEW |

Special logic: `withCalendarCardIfVportHasBookingTab` — if VPORT type has a "book" tab (from `getVportTabsByType`), the `calendar` card is injected.

---

## Architectural Findings

| ID | Severity | Summary | Provenance |
|---|---|---|---|
| ARCH-001 | MEDIUM | `booking.adapter.js` exports `getActorByIdDAL` — DAL function violates adapter contract | [SOURCE_VERIFIED] |
| ARCH-002 | LOW | `screens/model/` compatibility re-export shims are legacy residue | [SOURCE_VERIFIED] |
| ARCH-003 | MEDIUM | Route `/actor/:actorId/dashboard` not captured in scanner route-map — auth guard unconfirmed | [SOURCE_VERIFIED] |
| ARCH-004 | INFO | `useIdentity` imported from global state path — not a violation | [SOURCE_VERIFIED] |
| ARCH-005 | LOW | `vportBookingHistoryView.model.js` in shell scope; belongs to bookings card module | [SOURCE_VERIFIED] |

Full finding details: `outputs/2026/06/05/ARCHITECT/vcsm.dashboard.shell.architecture.md`

---

## Module Independence

**Classification:** MOSTLY INDEPENDENT

Shell has clear ownership, entry points, ownership gate, card catalog, and all UI layers. Cross-feature dependencies are correctly routed through adapters with one exception (ARCH-001). No write surfaces in the shell.

---

## Handoff Recommendations

| Command | Reason |
|---|---|
| SPIDER-MAN | No tests for ownership gate or shell rendering (P1) |
| HAWKEYE | Route auth guard not confirmed by scanner (P1) |
| VENOM | SECURITY.md upgrade; route access classification (P2) |
| SENTRY | Adapter boundary enforcement — booking.adapter DAL export (P2) |
| IRONMAN | useOwnerQuickStats ownership; vportBookingHistoryView.model.js scope (P3) |
| LOKI | screens/model/ re-export usage before deletion (P3) |
