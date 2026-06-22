---
name: vcsm.dashboard.behavior
description: Feature-level behavior contract for the VCSM dashboard feature. Covers all sub-modules at summary level.
metadata:
  type: behavior
  status: ACTIVE
  replaces: PLACEHOLDER
  authored-by: LOGAN (WOLVERINE Phase 2)
  date: 2026-06-05
  ticket: TICKET-DASH-WOLVERINE-001
  evidence-standard: SOURCE_VERIFIED | ARCHITECT_VERIFIED | SCANNER_VERIFIED | UNKNOWN
---

# Feature Behavior Contract — dashboard
**Application:** VCSM
**Status:** ACTIVE — replaces PLACEHOLDER stub

---

## §1 Summary

The dashboard feature is the VPORT owner control center for VCSM. It provides:

1. A guard-protected shell that verifies VPORT ownership and dispatches the owner to card sub-modules [SOURCE_VERIFIED — OwnerOnlyDashboardGuard + useVportOwnership]
2. Fourteen specialized management surfaces (booking history, calendar, gas prices, team, leads, portfolio, reviews, exchange, locksmith, schedule, services, settings + shell dispatch) [SOURCE_VERIFIED — app.routes.jsx lines 205–218]
3. The Design Studio — a canvas-based flyer editor for creating branded VPORT marketing materials [SOURCE_VERIFIED — lazyApp.jsx, VportActorMenuFlyerEditorScreen]
4. QR code generation for VPORT menus and review pages [SOURCE_VERIFIED — qrcode/adapters/qrcode.adapter.js]
5. Public-facing flyer and menu view screens (read-only, unauthenticated) [SOURCE_VERIFIED — vportMenu.routes.jsx]

The feature does not own any write surface at the shell level. All mutations are delegated to card sub-modules, each of which independently enforces VPORT ownership before accepting writes.

---

## §2 Module Identity

| Field | Value |
|---|---|
| Feature path | `apps/VCSM/src/features/dashboard/` |
| Doc path | `ZZnotforproduction/APPS/VCSM/features/dashboard/` |
| Modules | dashboard (shell), bookings, calendar, gasprices, leads, portfolio, reviews, services, exchange, locksmith, schedule, team, settings, flyerBuilder, designStudio, qrcode |
| FEATURE_STATUS | ACTIVE / HIGH tier |
| File count | 258 source files [ARCHITECT_VERIFIED] |
| Write surfaces | 37 across 15 DB tables [IRONMAN_VERIFIED] |
| THOR status | BLOCKED — VEN-CARD-001 (HIGH) + OWN-DSH-001 + OWN-DSH-002 |

---

## §3 Status

| Area | Status |
|---|---|
| Shell module BEHAVIOR.md | ACTIVE (ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/BEHAVIOR.md) |
| Feature ARCHITECTURE.md | ACTIVE (2026-06-04) |
| Feature SECURITY.md | ACTIVE (updated 2026-06-05) |
| Feature OWNERSHIP.md | ACTIVE (2026-06-05) |
| Feature CURRENT_STATUS.md | ACTIVE (updated 2026-06-05) |
| TESTS.md | MISSING — Phase 3 (SPIDER-MAN) |
| PERFORMANCE.md | MISSING |

---

## §4 Dependencies

### Engines (all via approved adapter boundaries)
[SOURCE_VERIFIED — verified against ARCHITECT + IRONMAN ownership record]

| Engine | Adapter | Role |
|---|---|---|
| engines/availability | availability adapter | Calendar and schedule availability rules |
| engines/booking | booking.adapter | Ownership verification (assertActorOwnsVportActorController), actor reads |
| engines/hydration | hydration adapter | Identity hydration for team candidate list |
| engines/identity | identity adapter | Actor resolution, actor_owners lookup |
| engines/lead | lead adapter | Leads card DAL |
| engines/media | media.adapter | Asset creation — flyerBuilder and portfolio |
| engines/menu | menu adapter | Flyer and QR generation sub-systems |
| engines/notification | notifications.adapter | Booking update and team invite notifications |
| engines/portfolio | portfolio adapter | Portfolio card — `addMedia`, `isActorOwner` |
| engines/profile | profiles.adapter | Public VPORT profile reads at shell |
| engines/qr | qrcode.adapter | QR code generation |
| engines/review | review adapter | Reviews card — owner read |

### External Systems
- Supabase — all DB writes and RLS enforcement [ARCHITECT_VERIFIED]
- Supabase Storage — media uploads (design assets, portfolio media) [SOURCE_VERIFIED]
- In-memory fuel price cache (fuelPriceCache.service.js) [SOURCE_VERIFIED]

---

## §5 Entry Routes

All routes confirmed registered in `apps/VCSM/src/app/routes/` [HAWKEYE_VERIFIED — 2026-06-05].

### Protected Dashboard Routes
**Guard chain:** ProtectedRoute → ProfileGatedOutlet → BlockedVportGuard → OwnerOnlyDashboardGuard

| Path | Screen |
|---|---|
| `/actor/:actorId/dashboard` | VportDashboardScreen (shell dispatch) |
| `/actor/:actorId/dashboard/gas` | VportDashboardGasScreen |
| `/actor/:actorId/dashboard/reviews` | VportDashboardReviewScreen |
| `/actor/:actorId/dashboard/leads` | VportDashboardLeadsScreen |
| `/actor/:actorId/dashboard/services` | VportDashboardServicesScreen |
| `/actor/:actorId/dashboard/exchange` | VportDashboardExchangeScreen |
| `/actor/:actorId/dashboard/calendar` | VportDashboardCalendarScreen |
| `/actor/:actorId/dashboard/portfolio` | VportDashboardPortfolioScreen |
| `/actor/:actorId/dashboard/locksmith` | VportDashboardLocksmithScreen |
| `/actor/:actorId/dashboard/booking-history` | VportDashboardBookingHistoryScreen |
| `/actor/:actorId/dashboard/team` | VportDashboardTeamScreen |
| `/actor/:actorId/dashboard/team-requests` | BarberTeamRequestsScreen |
| `/actor/:actorId/dashboard/schedule` | VportDashboardScheduleScreen |
| `/actor/:actorId/settings` | VportSettingsScreen |

### Release-Flagged Protected Route (auth-only, not in guard chain)
| Path | Screen | Flag |
|---|---|---|
| `/actor/:actorId/menu/flyer/edit` | VportActorMenuFlyerEditorScreen | releaseFlags.vportFlyerEditor |

### Public Routes (no authentication required)
| Path | Screen |
|---|---|
| `/actor/:actorId/menu` | VportActorMenuPublicScreen |
| `/actor/:actorId/menu/qr` | VportActorMenuQrScreen |
| `/actor/:actorId/menu/flyer` | VportActorMenuFlyerScreen (if releaseFlags.vportPrintableFlyer) |
| `/profile/:slug/menu` | VportMenuBySlugScreen |
| `/profile/:slug/menu/qr` | VportMenuQrBySlugScreen |
| `/profile/:slug/reviews` | VportReviewsBySlugScreen |
| `/profile/:slug/reviews/qr` | VportReviewsQrBySlugScreen |
| `/m/:actorId` | VportMenuRedirectScreen |

---

## §6 Happy Paths (Feature-Level)

### BEH-DASHBOARD-FEATURE-001 — VPORT Owner Access Sequence [SOURCE_VERIFIED]

1. User navigates to `/actor/:actorId/dashboard`
2. ProtectedRoute verifies Supabase session; unauthenticated users → redirect to auth
3. ProfileGatedOutlet verifies user has a VCSM actor profile; incomplete profiles → onboarding
4. BlockedVportGuard checks if the VPORT actor is in a blocked state; blocked VPORTs cannot access dashboard
5. OwnerOnlyDashboardGuard reads `actorId` from URL params, reads `actorId` from identity hook, compares; non-matching → "You can only access the dashboard for your own vport."
6. VportDashboardScreen mounts; `useVportOwnership` fires `checkVportOwnership.controller.js` → DB-backed `actor_owners` query
7. Owner confirmed → card catalog built by `buildDashboardCards.model.js` based on VPORT type
8. User sees type-specific card grid; navigates to a card → imperative push to sub-route
9. Sub-route screen mounts; card controller independently verifies ownership before any write

### BEH-DASHBOARD-FEATURE-002 — Card Mutation Sequence [SOURCE_VERIFIED]

1. User on any write-capable card screen
2. User triggers mutation (e.g., mark lead contacted, update booking, add team member)
3. Card hook calls card controller with `(actorId, payload, callerActorId)`
4. Card controller calls `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` BEFORE any DB write
5. Ownership confirmed → DB write proceeds; result normalized via card model
6. Hook updates local state; UI reflects change
7. Relevant cache invalidation triggered (e.g., `invalidateVportPublicDetails`, fuel price cache)

### BEH-DASHBOARD-FEATURE-003 — Design Studio Session [SOURCE_VERIFIED]

1. User navigates to `/actor/:actorId/menu/flyer/edit` (auth required, no guard chain)
2. VportActorMenuFlyerEditorScreen mounts; flyerEditor hook loads design document
3. User edits canvas (add elements, change colors, upload images)
4. Upload: `ctrlUploadDesignAsset` → `requireOwnerActorAccess(ownerActorId)` → upload proceeds
5. Save page: `ctrlSaveDesignPageScene` → `requireDesignDocumentOwnerAccess` → DB write
6. User exports: `ctrlQueueDesignExport` → render job queued; status polls via `ctrlRefreshDesignExports`
7. User saves flyer public details: `saveFlyerPublicDetailsCtrl` → `requireOwnerActorAccess` → DB UPSERT on `vport.profile_public_details`

### BEH-DASHBOARD-FEATURE-004 — Public Menu / QR View [SOURCE_VERIFIED]

1. Any user (unauthenticated) navigates to `/actor/:actorId/menu/qr` or `/profile/:slug/menu`
2. Screen loads; reads VPORT public profile and menu data (read-only DAL)
3. No auth required; no session check; no ownership enforcement
4. QR code displayed; menu items displayed; no mutations available to public users

---

## §7 Data Reads

### Shell-Level Reads [SOURCE_VERIFIED — VportDashboardScreen + hooks]

| Hook | Data | Frequency |
|---|---|---|
| `useVportOwnership` | `actor_owners` — DB-backed ownership check | Every mount + focus/visibilitychange |
| `useOwnerQuickStats` | Booking count, lead count, fuel price state | Shell mount |
| `useVportDashboardDetails` | VPORT public profile details | Shell mount |
| `checkVportOwnership.controller.js` | `actor_owners` (canonic ownership query) | Every focus/visibilitychange event |

### Card-Level Reads (summary)

| Card | Primary Read | Source |
|---|---|---|
| bookings | Bookings by actorId + date | `listVportBookingsForProfileDay.read.dal.js` |
| calendar | Availability rules | engines/availability adapter |
| gasprices | Current fuel prices, submission history | `vportFuelPrices.read.dal.js` |
| team | Team members by profileId | `vportTeam.read.dal.js` |
| leads | Business card leads | `vportLeads.read.dal.js` |
| portfolio | Portfolio items + media | engines/portfolio adapter |
| reviews | Reviewer summaries | engines/review adapter |
| services | Service catalog | engines/services adapter |
| exchange | Exchange listings | exchange card DAL |
| locksmith | Locksmith services | locksmith card DAL |
| schedule | Schedule slots | engines/availability adapter |
| settings | Public details, hours, address | `vportPublicDetails.read.dal.js` |
| flyerBuilder | Design documents, pages, versions | `designStudio.read.dal.js` |
| qrcode | VPORT slug, menu URL | VPORT profile read |

---

## §8 Mutations

### Feature-Level Write Surface Inventory [IRONMAN_VERIFIED]
[SOURCE_VERIFIED — all controllers read during WOLVERINE Phase 1]

| Card | Operations | Ownership Gate |
|---|---|---|
| bookings | UPDATE status | assertActorOwnsVportActorController |
| calendar | INSERT/UPDATE availability rules | availability adapter |
| gasprices | UPSERT prices, INSERT history/submissions | submitFuelPriceSuggestionController |
| team | INSERT/UPDATE/DELETE team members and invites | assertActorOwnsVportActorController |
| leads | UPDATE (mark contacted), DELETE | assertActorOwnsVportActorController |
| portfolio | INSERT portfolio media (addMedia engine) | engines/portfolio isActorOwner + profile_id match |
| settings | UPSERT public details | assertActorOwnsVportActorController |
| flyerBuilder | INSERT/UPDATE/DELETE design documents, pages, versions, exports, assets | requireOwnerActorAccess / requireDesignDocumentOwnerAccess |
| flyerBuilder (upload) | PUT to Supabase storage (design_asset scope) | **NONE — VEN-CARD-001 OPEN** |

### Notifications (side-effect mutations)
- Booking update → `publishVcsmNotification` to booking customer [SOURCE_VERIFIED — updateVportBooking.controller.js]
- Team invite sent → `publishVcsmNotification` to barber VPORT [SOURCE_VERIFIED — vportTeam.controller.js]

---

## §9 Auth & Access Rules

| Rule | Enforcement Layer | DB-Backed |
|---|---|---|
| User must be authenticated | ProtectedRoute (route layer) | Session check only |
| User must have a VCSM actor profile | ProfileGatedOutlet | DB — actor lookup |
| VPORT must not be blocked | BlockedVportGuard | DB — blocked_vport flag |
| URL actorId must match session actorId | OwnerOnlyDashboardGuard | UI only — not authoritative |
| Actor must own the VPORT (authoritative) | useVportOwnership + card controllers | DB — actor_owners table |
| Card write operations: controller must assert ownership | Card controller layer | DB — actor_owners |
| Design Studio: owner must match session | requireOwnerActorAccess / requireDesignDocumentOwnerAccess | DB — actor_owners |
| Flyer upload: **NO ownership check** [VEN-CARD-001] | MISSING | None |

**Authority hierarchy (most authoritative → least):**
1. DB-backed `actor_owners` check (assertActorOwnsVportActorController / requireOwnerActorAccess)
2. Screen-level `useVportOwnership` hook
3. OwnerOnlyDashboardGuard (UI convenience — self-documented as not authoritative)

---

## §10 UI States (Feature-Level)

| State | Trigger | Render |
|---|---|---|
| Unauthenticated | No session | Redirect to auth (ProtectedRoute) |
| No actor profile | Profile not setup | Onboarding (ProfileGatedOutlet) |
| Blocked VPORT | blocked_vport === true | Block message (BlockedVportGuard) |
| Wrong owner | actorId mismatch | "You can only access the dashboard for your own vport." |
| Loading | identityLoading \|\| ownershipLoading | SkeletonCardList |
| Owner verified — desktop | isOwner + isDesktop | Portal to document.body (z-index 9999) |
| Owner verified — mobile | isOwner + isMobile | Inline render |
| Card loading | Card hook data loading | Card-level skeleton |
| Card error | Card hook error | Card-level error UI |
| Mutation loading | Controller in-flight | Optimistic UI or spinner (card-specific) |
| Empty state | No data for card (no bookings, no leads, etc.) | Card-level empty state |

---

## §11 Side Effects

| Trigger | Effect |
|---|---|
| Window focus or visibilitychange | `checkVportOwnership.controller.js` — re-fires actor_owners DB query |
| Booking status update | `publishVcsmNotification` to customer actor |
| Team invite sent | `publishVcsmNotification` to barber VPORT |
| Settings saved | `invalidateVportPublicDetails(actorId)` cache bust |
| Fuel price updated | In-memory `fuelPriceCache` service eviction |
| Portfolio media added | `platform.media_assets` INSERT (non-blocking, fire-and-forget) |
| Design asset uploaded | `platform.media_assets` INSERT (non-blocking, fire-and-forget) |
| Design document exported | Render job queued in `design_render_jobs` |

---

## §12 Feature Boundaries

The dashboard feature must NOT:

- Import from another feature without going through an approved adapter
- Write to tables owned by other features without an engine adapter boundary
- Implement the ownership check logic — that belongs in `engines/booking` via `assertActorOwnsVportActorController`
- Render public-facing pages (public profiles belong to the profiles feature)
- Own the routing configuration (routes belong in app.routes.jsx)
- Treat OwnerOnlyDashboardGuard as an authoritative security boundary — it is UI-only
- Grant team members or org managers access to card write operations without a new guard contract reviewed by VENOM (see VPD-V-016 comment in vportLeads.controller.js)

---

## §13 Must Never Happen (Security Invariants)

[SOURCE_VERIFIED + IRONMAN_VERIFIED]

1. A user must never read or mutate another actor's leads, team, bookings, settings, or portfolio data without owning that VPORT — all write controllers enforce via actor_owners
2. A user must never upload to another VPORT's design_asset storage scope — **CURRENTLY POSSIBLE via uploadFlyerImageCtrl (VEN-CARD-001 OPEN)**
3. A non-owner must never see dashboard card content — OwnerOnlyDashboardGuard prevents render (UI layer)
4. A booking must never be moved from a terminal state (cancelled, completed) to another state — terminal state guard in updateVportBooking.controller.js
5. A system fuel price post must never use the void realm ID — resolvePublicRealmIdDAL() is always used, never viewer session realmId
6. A VPORT must never access its own dashboard if it is in a blocked state — BlockedVportGuard enforces
7. The design document owner_actor_id must always match the request ownerActorId — requireDesignDocumentOwnerAccess validates this at every write

---

## §14 Unknowns

| Item | Priority | Notes |
|---|---|---|
| uploadFlyerImageCtrl fix — requireOwnerActorAccess must be added | P0 — VEN-CARD-001 THOR BLOCKER | Patch required; see venom-rerun-phase1b.md for fix template |
| Named engineering owner for dashboard feature | P1 — OWN-DSH-001 THOR BLOCKER | Must be declared before THOR |
| Actor Ownership Contract authority | P1 — OWN-DSH-002 THOR BLOCKER | Which team/engineer owns the contract |
| RLS policies for design_* tables | P2 — TICKET-PLATFORM-RLS-001 | Unknown protection level on design_documents, design_pages, design_assets, etc. |
| useOwnerQuickStats consumer path | P3 | Hook present in OWNERSHIP.md; consumer screen not verified in this session |
| blockedVport field semantics | P3 | Where this is set, what business logic triggers it |
| Release flag values at runtime | P3 | vportFlyerEditor, vportPrintableFlyer — active states unknown from source |
