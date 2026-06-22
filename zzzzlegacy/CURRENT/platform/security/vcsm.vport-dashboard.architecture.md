# MODULE ARCHITECTURE REPORT

**Module:** VPORT Dashboard
**Application Scope:** VCSM
**Module Type:** Feature Module — Owner-Gated Business Command Center
**Primary Root:** `apps/VCSM/src/features/dashboard/vport/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE
**Scan Date:** 2026-05-23

---

## PURPOSE

The VPORT Dashboard is the authenticated owner command center for a VPORT business actor. It provides the VPORT owner (or acting-as user) with:

- A type-aware card grid as the primary entry point
- Sub-screens for each business function (bookings, calendar, team, portfolio, leads, services, settings, gas, exchange, locksmith, schedule, reviews, ads)
- Ownership-gated access to all mutations
- A unified data model for VPORT public details

Every screen inside the dashboard is owner-only. No public access surfaces exist in this module.

---

## OWNERSHIP

**Feature Owner:** `features/dashboard/vport/`
**Identity Contract:** Actor-based — `callerActorId` must own `targetActorId` via `actor_owners`
**Auth Gate:** `useVportOwnership` (UI) + `assertActorOwnsVportActorController` (security)
**Entry Route:** `/actor/:actorId/dashboard`

---

## ENTRY POINTS

All routes are protected (under `ProtectedRoute` + `ProfileGatedOutlet`):

| Route | Screen | Purpose |
|---|---|---|
| `/actor/:actorId/dashboard` | `VportDashboardScreen` | Main card grid hub |
| `/actor/:actorId/dashboard/booking-history` | `VportDashboardBookingHistoryScreen` | Booking list/tabs |
| `/actor/:actorId/dashboard/calendar` | `VportDashboardCalendarScreen` | Weekly availability |
| `/actor/:actorId/dashboard/schedule` | `VportDashboardScheduleScreen` | Live schedule grid |
| `/actor/:actorId/dashboard/team` | `VportDashboardTeamScreen` | Team member management |
| `/actor/:actorId/dashboard/team-requests` | `BarberTeamRequestsScreen` | Incoming team requests |
| `/actor/:actorId/dashboard/portfolio` | `VportDashboardPortfolioScreen` | Portfolio CRUD |
| `/actor/:actorId/dashboard/leads` | `VportDashboardLeadsScreen` | CRM leads |
| `/actor/:actorId/dashboard/services` | `VportDashboardServicesScreen` | Service catalog |
| `/actor/:actorId/dashboard/reviews` | `VportDashboardReviewScreen` | Reviews display |
| `/actor/:actorId/dashboard/gas` | `VportDashboardGasScreen` | Gas price management |
| `/actor/:actorId/dashboard/exchange` | `VportDashboardExchangeScreen` | Exchange rates |
| `/actor/:actorId/dashboard/locksmith` | `VportDashboardLocksmithScreen` | Locksmith settings |
| `/actor/:actorId/settings` | `VportSettingsScreen` | Public details CRUD |

> Route param `:actorId` is a raw UUID. See BW-VPD-001 in BLACKWIDOW report.

---

## DASHBOARD CARD CATALOG

### Complete Card Inventory (17 cards)

| Key | Title | Route Target | Constraint |
|---|---|---|---|
| `qr` | Menu QR | Modal / QR generator | None |
| `flyer` | Printable Flyer | Modal / print view | **Desktop only** |
| `flyer_edit` | Edit Flyer | `/actor/:actorId/menu/flyer/edit` | **Desktop only** |
| `menu_preview` | Preview Online Menu | External menu URL | None |
| `exchange` | Exchange Rates | `/dashboard/exchange` | None |
| `team` | Team | `/dashboard/team` | None |
| `portfolio` | Portfolio | `/dashboard/portfolio` | None |
| `locksmith` | Locksmith Manager | `/dashboard/locksmith` | None |
| `services` | Services | `/dashboard/services` | None |
| `reviews` | Reviews | `/dashboard/reviews` | None |
| `leads` | Leads | `/dashboard/leads` | None |
| `reviews_qr` | Reviews QR | Modal / QR generator | None |
| `booking_history` | Bookings | `/dashboard/booking-history` | None |
| `calendar` | Calendar & Slots | `/dashboard/calendar` | None |
| `gas` | Gas Prices | `/dashboard/gas` | None |
| `ads` | Ads Pipeline | `/ads/vport/:actorId` | Feature-flagged |
| `settings` | Settings | `/actor/:actorId/settings` | None |

### Cards by VPORT Type Preset

| Preset | Triggered By | Cards Shown |
|---|---|---|
| **default** | Arts/Media/Retail/Other | qr, flyer, flyer_edit, menu_preview, reviews, leads, reviews_qr, ads, settings |
| **service** | Beauty/Education/Health/Home/Professional/Sports/Transport/Animal | portfolio, qr, services, reviews, leads, reviews_qr, ads, settings |
| **barber** | `type = barber` | portfolio, calendar, booking_history, services, reviews, leads, reviews_qr, ads, settings |
| **barbershop** | `type = barbershop` | team, portfolio, calendar, booking_history, services, reviews, leads, reviews_qr, ads, settings |
| **locksmith** | `type = locksmith` | locksmith, portfolio, calendar, booking_history, services, reviews, leads, reviews_qr, ads, settings |
| **food** | Food/Hospitality/Events | qr, flyer, flyer_edit, menu_preview, services, reviews, leads, reviews_qr, ads, settings |
| **gas** | `type = gas station` / Gas & Fuel | gas, services, reviews, leads, reviews_qr, ads, settings |
| **exchange** | `type = exchange` | exchange, services, reviews, leads, reviews_qr, ads, settings |

> **Dynamic injection:** Any type that has a "book" tab (via `getTabsFn`) gets `calendar` prepended even if its preset doesn't include it.
> **Feature flag guard:** All card keys are filtered through `isDashboardCardEnabled(key)` from `shared/config/releaseFlags` before render.

---

## LAYER MAP

### DAL — Read (`features/dashboard/vport/dal/read/`)

| File | Table / View | Purpose |
|---|---|---|
| `actorOwners.read.dal.js` | `actor_owners` | Ownership link read |
| `actorVport.read.dal.js` | `vc.actors` | Actor-to-vport link |
| `listVportBookingsForProfileDay.read.dal.js` | `bookings` | Day-scoped booking list |
| `vportAvailabilityRules.read.dal.js` | `availability_rules` | Weekly rules by resource |
| `vportBookingById.read.dal.js` | `bookings` | Single booking fetch |
| `vportBookingsInRange.read.dal.js` | `bookings` | Range-scoped booking list |
| `vportCities.read.dal.js` | `cities` | City resolution for settings |
| `vportLeads.read.dal.js` | `vport_leads` or similar | Lead records by profile |
| `vportProfile.read.dal.js` | `vport_profiles` | Profile by actorId; actorId by profileId |
| `vportProfileActorAccess.read.dal.js` | `actor_owners` | Access check by profile |
| `vportResource.read.dal.js` | `booking_resources` | Resources by profile |
| `vportServices.read.dal.js` | `vport_services` | Service catalog items |
| `vportTeam.read.dal.js` | `team_members` | Team by profile |
| `vportTeamInvite.read.dal.js` | `team_invites` | Open invites |

### DAL — Write (`features/dashboard/vport/dal/write/`)

| File | Table | Purpose |
|---|---|---|
| `insertVportBooking.write.dal.js` | `bookings` | Insert booking row |
| `portfolioMediaRecord.write.dal.js` | `portfolio_media` | Insert media record |
| `updateVportBooking.write.dal.js` | `bookings` | Update booking status/fields |
| `vportLeads.write.dal.js` | `vport_leads` | Mark contacted, delete |
| `vportPublicDetails.write.dal.js` | `vport_public_details` | Upsert public details |
| `vportResource.write.dal.js` | `booking_resources` | Resource write |
| `vportTeam.write.dal.js` | `team_members` | Add/update/deactivate team |
| `vportTeamInvite.write.dal.js` | `team_invites` | Invite CRUD |

### Models (`features/dashboard/vport/model/`)

| File | Purpose |
|---|---|
| `dashboardVportDetails.model.js` (235 lines) | Full normalizer: address, hours, social links, flyer fields, directions URL |
| `vportAvailabilityRule.model.js` (11 lines) | Availability rule shape transform |
| `vportBooking.model.js` (19 lines) | Booking row → domain shape |
| `vportSettingsDraft.model.js` (18 lines) | Settings form draft shape |

### Screen Models (`screens/model/`)

| File | Purpose |
|---|---|
| `buildDashboardCards.model.js` (135 lines) | CARD_CATALOG + builder — assembles card array with handlers |
| `dashboardViewByVportType.model.js` (159 lines) | View presets + type→preset resolver + release-flag filter |
| `vportBookingHistoryView.model.js` (25 lines) | `filterBookings(tab)` + `groupByDate()` |

### Screen Utility (`screens/`)

| File | Purpose |
|---|---|
| `vportDashboardLeadsScreen.model.js` (35 lines) | Lead display formatters (date, source label, message preview) |
| `vportSettingsValidation.js` (70 lines) | Address form validation / normalization |
| `vportDashboardShellStyles.js` (43 lines) | Responsive shell style factory |
| `useDesktopBreakpoint.js` (29 lines) | `matchMedia('min-width: 821px')` hook |

### Controllers (`features/dashboard/vport/controller/`)

| File | Auth Gate | Purpose |
|---|---|---|
| `checkVportOwnership.controller.js` | — | UI ownership check (resolves bool) |
| `saveVportPublicDetailsByActorId.controller.js` | `assertActorOwns` | Upsert public details |
| `loadDaySchedule.controller.js` | — (read) | Day bookings assembly |
| `probeVportPortfolio.controller.js` | — (read) | Portfolio load |
| `addPortfolioMediaWithRecord.controller.js` | — | Media + record insert |
| `vportOwnerStats.controller.js` | — (read) | Owner stat aggregation |
| `vportLeads.controller.js` | `assertCallerOwns` ⚠️ | Leads CRUD (WEAK gate — BW-VPD-003) |
| `listVportServicesForProfile.controller.js` | — | Service list |
| `createOwnerBooking.controller.js` | `assertActorOwns` | Owner quick-book insert |
| `updateVportBooking.controller.js` | `assertActorOwns` | Booking status + reschedule ⚠️ (BW-VPD-002) |
| `vportPublicBooking.controller.js` | Optional | Public booking insert ⚠️ (BW-VPD-010) |
| `vportTeam.controller.js` | `assertActorOwns` | Team read |
| `vportTeamAccess.controller.js` | `assertActorOwns` | Team CRUD + candidate search |
| `vportTeamInvite.controller.js` | `assertActorOwns` | Invite CRUD |

> ⚠️ = BLACKWIDOW finding open

### Hooks (`features/dashboard/vport/hooks/`)

| File | Lines | Purpose |
|---|---|---|
| `useVportOwnership.js` | 61 | Owner bool — UI-only, fails closed |
| `useOwnerQuickStats.js` | 20 | Stats load (new leads + pending bookings) |
| `useQuickBookingModal.js` | 73 | Owner quick-book modal state |
| `useVportOwnerSchedule.js` | 150 | Schedule data (day bookings, resources, rules) |
| `useVportBookingActions.js` | 31 | Booking action dispatch (confirm/cancel/reschedule) |
| `useVportBookingOps.js` | 13 | Booking ops adapter hook |
| `useVportLeads.js` | 100 | Leads list + mutations |
| `useVportNewLeadsCount.js` | 31 | Badge count for new leads |
| `useSaveVportPublicDetailsByActorId.js` | 18 | Settings save hook |
| `useVportPortfolioProbe.js` | 51 | Portfolio load |
| `useVportTeam.js` | 73 | Team data + mutations |
| `useVportTeamAccess.js` | 89 | Team access CRUD + search |
| `useBarberTeamRequests.js` | 68 | Incoming team requests for barbershops |

### Adapter (`features/dashboard/vport/adapters/vport.adapter.js`)

Public surface exposed to outside:
- `useDesktopBreakpoint`
- `VportBackButton`
- `useOwnerQuickStats`
- `useVportBookingOps`
- `VportDashboardScheduleScreen`
- `useVportTeam`
- `createVportDashboardShellStyles`
- `mapAvailabilityRule`

> Intentionally thin — most screens are self-contained via route entry, not consumed via adapter.

### Screens (`screens/`) — 15 files

| Screen | Lines | Notes |
|---|---|---|
| `VportDashboardScreen.jsx` | 214 | Main hub — card grid, loads details, routes to sub-screens |
| `VportDashboardBookingHistoryScreen.jsx` | 19 | Thin wrapper delegating to View |
| `VportDashboardBookingHistoryView.jsx` | 269 | Tabs, booking cards, quick-book modal |
| `VportDashboardCalendarScreen.jsx` | 210 | Weekly availability grid |
| `VportDashboardScheduleScreen.jsx` | 167 | Live schedule grid — embedded mode supported |
| `VportDashboardTeamScreen.jsx` | 227 | Team CRUD |
| `BarberTeamRequestsScreen.jsx` | 162 | Incoming requests view |
| `VportDashboardPortfolioScreen.jsx` | 238 | Portfolio CRUD + media upload |
| `VportDashboardLeadsScreen.jsx` | 280 | Lead list + CRM actions |
| `VportDashboardServicesScreen.jsx` | 100 | Service catalog wrapper |
| `VportDashboardReviewScreen.jsx` | 77 | Reviews display |
| `VportDashboardGasScreen.jsx` | 268 | Gas price management |
| `VportDashboardExchangeScreen.jsx` | 278 | Exchange rate editor |
| `VportDashboardLocksmithScreen.jsx` | 195 | Locksmith service areas + details |
| `VportSettingsScreen.jsx` | 277 | Public details CRUD |

### Components

| Component | Purpose |
|---|---|
| `VportBackButton.jsx` | Back nav (responsive) |
| `CardSettingToggleRow.jsx` | Toggle row for settings |
| `VportDashboardParts.jsx` | Shared UI parts (header, stats chips) |
| `VportDashboardGasPanels.jsx` | Gas price panels |
| `VportSettingsBusinessCard.jsx` | Business card settings section |
| `VportSettingsTrazeCard.jsx` | TRAZE visibility toggle |
| `VportSettingsAdsPreview.jsx` | Ads preview strip |
| `PortfolioBugsBunnyPanel.jsx` | Portfolio item debug/detail panel |
| `PortfolioItemForm.jsx` (292) | Full portfolio item editor |
| `PortfolioManagerCard.jsx` | Portfolio item card |
| `locksmithScreenComponents.jsx` | Locksmith area/service components |
| **Schedule:** `ScheduleGrid`, `ScheduleOperationalView`, `ScheduleModals`, `ScheduleLaneElements`, `BarberLaneHeader` | Full schedule UI |
| **Team:** `TeamMemberCards`, `AddTeamMemberSheet`, `ConfirmRemoveModal` | Team management UI |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Owner command center for VPORT actors | — |
| Owner defined | PASS | `features/dashboard/vport/` clearly scoped | — |
| Entry points mapped | PASS | 14 routes under `/actor/:actorId/dashboard/*` | `:actorId` is raw UUID (BW-VPD-001) |
| Controllers present | PASS | 14 controllers covering all write operations | vportLeads uses weak auth gate |
| DAL/repository present | PASS | 14 read + 8 write DAL files | RLS not verified in source (ASSUMED) |
| Models/transformers | PASS | 4 domain models + 3 screen models | — |
| Hooks/view models | PASS | 13 hooks fully covering all screens | — |
| Screens/components | PASS | 15 screens + 20+ components | — |
| Services/adapters | PARTIAL | Thin adapter (8 exports) | Many cross-feature calls go direct via import rather than adapter |
| Database objects mapped | PARTIAL | Tables identified; schema/RLS not in source | RLS assumed but unverified |
| Authorization path | PARTIAL | Strong on most paths; weak on leads | BW-VPD-002, BW-VPD-003, BW-VPD-010 open |
| Cache/runtime behavior | PARTIAL | TTL cache used; invalidation strategy not fully mapped | `invalidateVportPublicDetails` callback pattern |
| Error/loading/empty states | PARTIAL | Present in screens; not all paths covered | Some screens lack explicit empty state components |
| Documentation linked | PARTIAL | No logan doc found for this module | MISSING — needs `/logan/vcsm/dashboard/vcsm.dashboard.vport.md` |
| Tests/validation noted | FAIL | No test files found in this module | No unit or integration tests |
| Native parity noted | PARTIAL | Schedule has embedded mode for native | No formal native parity document |
| Engine dependencies | PASS | notifications, portfolio, hydration, booking adapters used | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `@/features/booking/adapters/booking.adapter` | feature | inbound | APPROVED (adapter) | Used for `assertActorOwnsVportActorController` |
| `@/features/actors/adapters/actors.adapter` | feature | inbound | APPROVED (adapter) | Used for `searchActorsAdapter` in team search |
| `@/features/notifications/adapters/notifications.adapter` | feature | inbound | APPROVED (adapter) | Used for `publishVcsmNotification` |
| `@/features/profiles/adapters/kinds/vport/config/vportTypes.config.adapter` | feature | inbound | APPROVED (adapter) | VPORT_TYPE_GROUPS for preset resolution |
| `@portfolio` (engine) | engine | inbound | APPROVED | Portfolio item CRUD |
| `@hydration` (engine) | engine | inbound | ASSUMED | Actor summaries hydration |
| Supabase `vportSchema` | database | outbound | APPROVED | Vport schema client |
| `shared/config/releaseFlags` | shared | inbound | APPROVED | `isDashboardCardEnabled` filter |
| `shared/lib/ttlCache` | shared | inbound | ASSUMED | Via booking/hydration engines |
| `@/services/supabase/vportClient` | service | outbound | APPROVED | DB access |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vc.actors` | read | identity engine | `checkVportOwnership`, `assertActorOwns` | OK |
| `actor_owners` | read | identity engine | `assertActorOwnsVportActorController`, `actorOwners.read.dal` | OK |
| `vport_profiles` | read/write | dashboard/vport DAL | all dashboard controllers | OK |
| `bookings` | read/write | dashboard/vport + booking feature | `updateVportBooking`, `insertVportBooking`, `getVportBookingById` | No terminal-state guard (BW-VPD-002) |
| `booking_resources` | read/write | dashboard/vport | `vportResource.read/write.dal` | OK |
| `availability_rules` | read/write | booking feature + dashboard | `vportAvailabilityRules.read.dal` | OK |
| `vport_public_details` | read/write | dashboard/vport | `saveVportPublicDetailsByActorId` | OK (ownership checked) |
| `team_members` | read/write | dashboard/vport | `vportTeam.write/read.dal` | OK |
| `team_invites` | read/write | dashboard/vport | `vportTeamInvite.write/read.dal` | OK |
| `vport_leads` | read/write | dashboard/vport | `vportLeads.write/read.dal` | Weak auth gate (BW-VPD-003) |
| `vport_services` | read | dashboard/vport | `vportServices.read.dal` | OK |
| `portfolio_media` | write | dashboard/vport | `portfolioMediaRecord.write.dal` | OK |
| Notification payloads | write | notifications engine | `publishVcsmNotification` | UUID in linkPath (BW-VPD-001) |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route entry exists | PASS | All 14 routes registered in `app.routes.jsx` | — |
| Loading state | PASS | `ownershipLoading` in `useVportOwnership`; skeleton states in schedule | Partial on some screens |
| Empty state | PARTIAL | Booking history, portfolio have empty states | Not all sub-screens have empty state components |
| Error state | PARTIAL | Screens have error strings; no unified error UI component | Inconsistent error presentation |
| Auth/owner gate | PARTIAL | Strong on most paths | vportLeads weak; booking state replay open |
| Cache behavior | PARTIAL | `invalidateVportPublicDetails` callback used | No unified invalidation strategy visible |
| Runtime dependencies | PASS | Hooks cover all controller paths | — |
| Hot paths identified | PASS | Schedule grid, booking history, leads list | High query volume in schedule/calendar |
| LOKI handoff recommended | YES | Schedule grid + leads list are high-frequency | N+1 risk in `loadDaySchedule` → per-resource booking fetch |
| KRAVEN handoff recommended | YES | `VportDashboardScheduleScreen` renders many bookings | Heavy DOM in `ScheduleGrid` + `ScheduleOperationalView` |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | `logan/vcsm/dashboard/vcsm.dashboard.vport.md` | MISSING |
| Ownership record | CLAUDE.md feature boundary | PARTIAL |
| Security audit (BLACKWIDOW) | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-23_14-00_blackwidow_vport-dashboard.md` | PRESENT |
| Runtime audit (LOKI) | — | MISSING |
| Performance audit (KRAVEN) | — | MISSING |
| Migration audit (CARNAGE) | — | MISSING |
| Native transfer audit (FALCON) | — | MISSING |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Terminal-state guard on booking mutations | HIGH | Owner can re-open completed bookings; corrupts history | Controller layer |
| Replace weak `assertCallerOwns` in vportLeads with canonical gate | HIGH | Inconsistent ownership enforcement | Controller layer |
| Slug resolution in notification linkPaths | HIGH | Raw UUID exposed in every booking notification | Controller layer |
| `customerActorId` guard in public booking | HIGH | Attribution injection — Actor A can create bookings attributed to Actor B | Controller layer |
| Logan documentation for this module | MEDIUM | Wolverine, Logan, Sentry have no doc to reference | Logan |
| Unit tests for `buildDashboardCards` + `dashboardViewByVportType` model | MEDIUM | Card configuration is type-critical business logic | Test |
| Unified error state component for dashboard screens | MEDIUM | Inconsistent error presentation across 14 screens | Component layer |
| RLS verification for `bookings` read DAL | MEDIUM | Any authenticated actor may read any booking by ID if RLS absent | DB / CARNAGE |
| Slug-based routing for dashboard routes | MEDIUM | `/actor/:actorId/*` exposes raw UUID in URL bar | Router / VENOM |
| Native parity document for schedule embedded mode | LOW | Falcon cannot verify parity without doc | FALCON |
| Empty state components for exchange, locksmith, gas screens | LOW | Blank screens on first use | Component layer |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: `features/dashboard/vport/controller/vportLeads.controller.js`
Module: VPORT Dashboard
Current dependency: Local `assertCallerOwns` string comparison
Expected boundary: `assertActorOwnsVportActorController` via `booking.adapter`
Risk: Weaker ownership gate than canonical; inconsistent trust model across dashboard
Suggested correction: Import and use `assertActorOwnsVportActorController` from `@/features/booking/adapters/booking.adapter`

---

**MODULE BOUNDARY WARNING**
Location: `features/dashboard/vport/controller/vportPublicBooking.controller.js`
Module: VPORT Dashboard
Current dependency: `customerActorId` accepted from caller without cross-validation
Expected boundary: In public flow, `customer_actor_id` must equal `requestActorId`
Risk: Booking attribution injection (BW-VPD-010)
Suggested correction: Assert equality or move owner-on-behalf semantics to owner-only controller

---

**MODULE BOUNDARY WARNING**
Location: `screens/model/dashboardViewByVportType.model.js` line 1
Module: VPORT Dashboard
Current dependency: `VPORT_TYPE_GROUPS` imported from `@/features/profiles/adapters/kinds/vport/config/vportTypes.config.adapter`
Expected boundary: Acceptable (adapter boundary respected)
Risk: LOW — if profiles feature restructures vport type config, this breaks silently
Suggested correction: Consider extracting `VPORT_TYPE_GROUPS` to `shared/` or a dedicated vport-types config in `engines/`

---

## CODE HEALTH METRICS

| Module | Files | Layers | Cross-Feature Imports | Cycles Detected | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| vport-dashboard | 69 | 8 (DAL/Model/Controller/Hook/Component/Screen/Adapter/ScreenModel) | 5 (all via adapters) | 0 | 1 (`PortfolioBugsBunnyPanel` — naming suggests dev artifact) | WATCH |

**SPAGHETTI SCORE**
Module: vport-dashboard
Score: WATCH
Reasons:
- Screen model files (`vportDashboardLeadsScreen.model.js`) are co-located inside `screens/` rather than `model/` — minor org inconsistency
- `loadDaySchedule.controller.js` may orchestrate multiple per-resource DAL calls (N+1 candidate — LOKI verification needed)
- `VportDashboardBookingHistoryScreen.jsx` (19 lines) is a thin wrapper that delegates entirely to `VportDashboardBookingHistoryView.jsx` — acceptable split for Final Screen / View Screen boundary
Release risk: LOW

---

## DEAD CODE FINDINGS

**DEAD CODE FINDING**
Location: `screens/components/PortfolioBugsBunnyPanel.jsx`
Code Type: Component
Classification: POSSIBLY LEGACY
Evidence: "BugsBunny" was an old internal command name (renamed Deadpool 2026-05-11 per memory). May be an artifact from debug session.
Risk: LOW — if rendered in production, it may show debug UI
Recommended action: VERIFY USAGE — confirm whether this is rendered in `VportDashboardPortfolioScreen` and whether it contains debug-only logic
Recommended handoff: IRONMAN (ownership), LOKI (runtime verification)

---

## DUPLICATE IMPLEMENTATION FINDINGS

**DUPLICATE IMPLEMENTATION FINDING**
Behavior: Booking by owner actorId — create
Locations:
- `createOwnerBooking.controller.js` — owner creates booking for their own VPORT (confirmed status, source="owner")
- `createVportPublicBookingController` — public creates booking (pending status, source="public")
Active paths: Both active; semantically distinct
Risk: LOW — different flows, different statuses, intentional split
Canonical owner: `createOwnerBooking` for owner path; `createVportPublicBooking` for customer path
Recommended consolidation path: No consolidation needed — semantics are distinct. Document clearly.

---

## FINAL MODULE STATUS

**MOSTLY COMPLETE**

The VPORT Dashboard module has a complete layer stack (DAL through Screen), consistent cross-feature boundaries via adapters, and clear ownership patterns. It is missing:
- Terminal-state guards on booking mutations (HIGH)
- Canonical ownership gate on leads (HIGH)
- Logan documentation
- Tests for card-catalog models

The module is runtime-ready for all screens except for the security gaps identified by BLACKWIDOW.

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P0 | Fix booking attribution injection (BW-VPD-010) | HIGH severity — any actor can pollute any other actor's booking history | Wolverine |
| P0 | Replace notification linkPath UUIDs with slugs (BW-VPD-001) | HIGH — UUID leaked to all notification recipients | Wolverine |
| P1 | Add terminal-state guard to booking mutations (BW-VPD-002) | Completed bookings can be re-mutated | Wolverine |
| P1 | Replace `assertCallerOwns` in vportLeads with canonical gate (BW-VPD-003) | Inconsistent ownership contract | Wolverine |
| P1 | Verify RLS on `bookings` read DAL | Booking IDs may be enumerable | DB → CARNAGE |
| P2 | Write Logan doc for this module | Missing governance artifact | Logan |
| P2 | Unified error state component | Dashboard UX polish | Wolverine |
| P2 | Tests for `buildDashboardCards` + `dashboardViewByVportType` | Business-critical config | Wolverine |
| P3 | Verify / clean `PortfolioBugsBunnyPanel` naming | Legacy artifact risk | Ironman |
| P3 | Extract `VPORT_TYPE_GROUPS` to shared config | Fragile cross-feature type dependency | SENTRY |

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| **VENOM** | Cross-reference BW-VPD-001, BW-VPD-002, BW-VPD-003, BW-VPD-010 with trust-boundary source analysis |
| **LOKI** | Runtime trace — `loadDaySchedule`, `useVportOwnerSchedule`, N+1 detection in schedule grid |
| **KRAVEN** | Performance — `ScheduleGrid` DOM cost; `VportDashboardBookingHistoryView` booking list render |
| **CARNAGE** | DB audit — RLS on `bookings` read, `vport_leads` table security, slug availability for notification links |
| **IRONMAN** | Ownership review — `PortfolioBugsBunnyPanel`; confirm `vportPublicBooking.controller.js` customerActorId semantics |
| **SENTRY** | Architecture compliance — `assertCallerOwns` inconsistency; `VPORT_TYPE_GROUPS` dependency path |
| **THOR** | Release gate — BW-VPD-010 and BW-VPD-001 are P0 blockers |
| **LOGAN** | Create canonical doc: `logan/vcsm/dashboard/vcsm.dashboard.vport.md` |
