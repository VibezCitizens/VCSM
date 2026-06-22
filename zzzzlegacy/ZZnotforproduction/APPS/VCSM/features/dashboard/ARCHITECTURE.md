---
name: vcsm.dashboard.architecture
description: ARCHITECT V2 module architecture report for VCSM:dashboard
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** dashboard
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/dashboard
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The dashboard module is the owner-facing control center for VCSM VPORTs. It provides a card-based shell that surfaces sub-dashboards organized by VPORT type (restaurant, barbershop, gas station, locksmith, etc.), letting VPORT owners manage bookings, team members, gas prices, portfolio media, flyers, QR codes, leads, reviews, exchange rates, and settings from a single entry point. The module also contains the Design Studio — a canvas-based editor for building branded marketing flyers — which writes multi-page design documents, assets, exports, and render jobs to the database.

## OWNERSHIP

VPORT owners/operators. The module is gated behind `useVportOwnership` (UI) and `assertActorOwnsVportActorController` (controller-layer). Primary engineering domain: VPORT marketplace operations. No single team is declared — ownership record is missing.

## ENTRY POINTS

| Entry Point | Path | Access |
|---|---|---|
| Vport Dashboard Shell | `/actor/:actorId/dashboard` | Authenticated VPORT owner |
| Booking History | `/actor/:actorId/dashboard/booking-history` | Owner |
| Calendar & Slots | `/actor/:actorId/dashboard/calendar` | Owner |
| Gas Prices | `/actor/:actorId/dashboard/gas` | Owner |
| Team | `/actor/:actorId/dashboard/team` | Owner |
| Leads | `/actor/:actorId/dashboard/leads` | Owner |
| Portfolio | `/actor/:actorId/dashboard/portfolio` | Owner |
| Locksmith Manager | `/actor/:actorId/dashboard/locksmith` | Owner |
| Settings | `/actor/:actorId/settings` (delegated to settings feature) | Owner |
| Services | `/actor/:actorId/dashboard/services` | Owner |
| Reviews | `/actor/:actorId/dashboard/reviews` | Owner |
| Exchange Rates | `/actor/:actorId/dashboard/exchange` | Owner |
| Flyer Editor | `/actor/:actorId/menu/flyer/edit` | Owner |
| Flyer View | `/actor/:actorId/menu/flyer` | Owner |
| Design Studio | (embedded within flyerBuilder) | Owner |
| QR Code | `/actor/:actorId/menu/qr` | Owner |

No routes appear in the route-map scanner (routes: []). All routing is handled internally via `useNavigate` calls within `VportDashboardScreen`.

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 94 | `designStudio.write.dal.js`, `updateVportBooking.write.dal.js`, `vportFuelPrices.write.dal.js`, `vportLeads.write.dal.js`, `vportTeam.write.dal.js` |
| Model | 76 | `buildDashboardCards.model.js`, `dashboardViewByVportType.model.js`, `gasPrices.model.js`, `vportBooking.model.js`, `vportSettingsDraft.model.js` |
| Controller | 75 | `updateVportBooking.controller.js`, `vportOwnerStats.controller.js`, `flyerEditor.controller.js`, `settingsCoordinator.controller.js`, `scheduleBookingCoordinator.controller.js` |
| Service | 1 | `fuelPriceCache.service.js` |
| Adapter | N/A | Scanner reports no adapter layer in cg counts (2 in fm_layerCounts: `vport.adapter.js`, `qrcode.adapter.js`) |
| Hook | 42 | `useVportOwnership.js`, `useOwnerQuickStats.js`, `useVportBookingActions.js`, `useVportGasPrices.js`, `useVportTeam.js` |
| Component | 173 | `VportDashboardParts.jsx`, `BookingCard.jsx`, `GasPricesPanel.jsx`, `ScheduleGrid.jsx`, `DesignStudioCanvasStage.jsx` |
| Screen | 17 | `VportDashboardScreen.jsx`, `VportDashboardBookingHistoryScreen.jsx`, `VportDashboardCalendarScreen.jsx`, `VportDashboardGasScreen.jsx`, `VportDashboardTeamScreen.jsx` |
| Barrel | 61 | `index.js` files per card sub-module (bookings, calendar, gasprices, leads, portfolio, reviews, schedule, services, settings, team, exchange, locksmith) |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source confirms purpose; BEHAVIOR.md is a placeholder | BEHAVIOR.md contains no real contract |
| Owner defined | FAIL | No ownership record exists | No team or engineer ownership declared |
| Entry points mapped | PARTIAL | 16 nav targets visible in VportDashboardScreen; no routes in scanner route-map | Route-map has no registered routes for this feature |
| Controllers present/delegated | PASS | 75 controllers (cg) covering all card sub-systems | — |
| DAL/repository present/delegated | PASS | 94 DAL files across read/write sub-directories | — |
| Models/transformers present | PASS | 76 model files; card catalog, vport type router, booking/gas/settings models | — |
| Hooks/view models present | PASS | 42 hooks covering ownership, stats, booking ops, gas prices, team, leads, schedule | — |
| Screens/components present | PASS | 17 screens, 173 components; all card sub-systems have screen representations | — |
| Services/adapters present | PARTIAL | 1 service file (fuelPriceCache); 2 adapter files (vport, qrcode) | Adapter layer thin; no dedicated dashboard adapter |
| Database objects mapped | PASS | 37 write surfaces across design, bookings, fuel prices, leads, team/resources, portfolio | — |
| Authorization path mapped | PASS | `useVportOwnership` (UI gate) + `assertActorOwnsVportActorController` (controller gate) confirmed in source | — |
| Cache/runtime behavior mapped | PARTIAL | `fuelPriceCache.service.js` is the only explicit cache; no broader cache strategy documented | — |
| Error/loading/empty states mapped | PARTIAL | Loading skeleton and sign-in guard in VportDashboardScreen; per-card states not uniformly documented | — |
| Documentation linked | FAIL | BEHAVIOR.md is a placeholder stub (Status: PLACEHOLDER) | Real behavior contract missing |
| Tests/validation noted | PASS | 25 tests across gasprices, bookings, team, schedule, portfolio, settings cards | — |
| Native parity noted | N/A | React web only; PWA — no native parity applicable | — |
| Engine dependencies mapped | PASS | 12 engines declared: availability, booking, hydration, identity, lead, media, menu, notification, portfolio, profile, qr, review | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/availability | engine | inbound | YES | Used by calendar/schedule cards |
| engines/booking | engine | inbound | YES | booking.adapter used by multiple controllers |
| engines/hydration | engine | inbound | YES | Identity hydration |
| engines/identity | engine | inbound | YES | Actor resolution, actor_owners check |
| engines/lead | engine | inbound | YES | Lead DAL in leads card |
| engines/media | engine | inbound | YES | media.adapter used by flyerEditor controller and portfolio |
| engines/menu | engine | inbound | YES | Menu flyer and QR sub-systems |
| engines/notification | engine | inbound | YES | notifications.adapter called by updateVportBooking.controller |
| engines/portfolio | engine | inbound | YES | Portfolio card |
| engines/profile | engine | inbound | YES | profiles.adapter used in VportDashboardScreen for vport type resolution |
| engines/qr | engine | inbound | YES | QR code generation |
| engines/review | engine | inbound | YES | Reviews card |
| features/profiles | cross-feature | inbound | VIA ADAPTER | `useVportDashboardDetails` and `useProfilesOps` imported via profiles adapter |
| features/booking | cross-feature | inbound | VIA ADAPTER | `assertActorOwnsVportActorController` via booking.adapter |
| features/notifications | cross-feature | inbound | VIA ADAPTER | `publishVcsmNotification` via notifications.adapter |
| features/media | cross-feature | inbound | VIA ADAPTER | `createMediaAssetController` via media.adapter |
| vc.bookings | db write | outbound | YES | updateVportBookingDAL, insertVportBookingDAL |
| vc.resources | db write | outbound | YES | insertVportResourceDAL, team CRUD |
| vc.design_documents / design_pages / design_page_versions / design_assets / design_exports / design_render_jobs | db write | outbound | YES | Design Studio write DAL |
| vc.fuel_prices / fuel_price_history / fuel_price_submissions / fuel_price_submission_reviews | db write | outbound | YES | Gas prices card |
| vc.business_card_leads | db write | outbound | YES | Leads card |
| vc.portfolio_media | db write | outbound | YES | Portfolio card |
| vport.profile_public_details | db write | outbound | YES | Flyer public details and settings |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| bookings | READ + UPDATE | dashboard/vport | booking engine | MEDIUM — terminal state guard confirmed; reschedule conflict check present |
| resources | READ + INSERT + DELETE + UPDATE | dashboard/vport | booking/availability engine | MEDIUM — team member CRUD scoped to profile |
| design_documents | INSERT + UPDATE | dashboard/flyerBuilder | Design Studio | LOW — owner_actor_id scoped |
| design_pages | INSERT + UPDATE + DELETE | dashboard/flyerBuilder | Design Studio | LOW |
| design_page_versions | INSERT + DELETE | dashboard/flyerBuilder | Design Studio | LOW |
| design_assets | INSERT | dashboard/flyerBuilder | Design Studio | LOW |
| design_exports | INSERT + DELETE | dashboard/flyerBuilder | Design Studio | LOW |
| design_render_jobs | INSERT + DELETE | dashboard/flyerBuilder | Design Studio | LOW |
| fuel_prices | UPDATE + UPSERT | dashboard/gasprices | gas price system | MEDIUM — unit update and crowd-sourced price flow |
| fuel_price_submissions | INSERT + UPDATE | dashboard/gasprices | gas price review flow | MEDIUM — citizen submission path |
| fuel_price_submission_reviews | INSERT + UPDATE | dashboard/gasprices | gas price review flow | MEDIUM — owner review/apply path |
| fuel_price_history | INSERT | dashboard/gasprices | gas price history | LOW |
| business_card_leads | UPDATE + DELETE | dashboard/leads | leads CRM | LOW — scoped to vport owner |
| portfolio_media | UPDATE | dashboard/portfolio | portfolio engine | LOW |
| vport.profile_public_details | UPSERT | dashboard (flyer + settings) | public VPORT profile | HIGH — public-facing; flyer details and directory visibility |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PARTIAL | `VportDashboardScreen` mounts from routing; sub-card screens linked via navigate | Route-map scanner found 0 registered routes — route registration may be in a separate router file not scanned |
| Loading state | PASS | Skeleton loader rendered during `identityLoading` or `ownershipLoading` | — |
| Empty state | PASS | "Sign in required" and "You can only access the dashboard for your own vport" guards confirmed in source | — |
| Error state | PARTIAL | Controllers throw errors; hook-level error handling not uniformly confirmed across all 12 card sub-systems | — |
| Auth/owner gates | PASS | Dual-layer: `useVportOwnership` (UI) + `assertActorOwnsVportActorController` (server-side); VPD-V-021 terminal state guard on bookings | — |
| Cache behavior | PARTIAL | `fuelPriceCache.service.js` present; no other explicit caching or stale-while-revalidate strategy documented | — |
| Runtime dependencies | PASS | 12 engines declared; cross-feature access goes through adapters as required | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md | PRESENT (PLACEHOLDER — not a real contract) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a stub | HIGH | 258-file module with 12 engines, 37 write surfaces, and 16 entry points has no behavior contract — unacceptable for release governance | LOGAN |
| Route registration not in scanner | HIGH | 0 routes in route-map despite 16+ navigable entry points — router file likely not covered by scanner, making the route audit incomplete | ARCHITECT / HAWKEYE |
| No declared module ownership | MEDIUM | No team or engineer is on record as owning this module | IRONMAN |
| Error state coverage unverified across all 12 cards | MEDIUM | Each card sub-system (gasprices, bookings, team, schedule, portfolio, leads, settings, locksmith, exchange, services, reviews, calendar) has independent hook/controller error paths; not uniformly documented | SENTRY |
| Cache strategy undocumented | LOW | Only gas prices has an explicit cache service; other high-frequency reads (bookings, team, availability) have no documented freshness strategy | KRAVEN |
| ARCHITECTURE.md was absent | LOW | This file was missing prior to this run; now PRESENT | ARCHITECT (resolved) |
| CURRENT_STATUS.md was absent | LOW | Status tracking file did not exist; now PRESENT | ARCHITECT (resolved) |
| Duplicate model files | LOW | `screens/model/buildDashboardCards.model.js` and `screens/model/dashboardViewByVportType.model.js` appear alongside canonical copies at `vport/model/` — duplication risk | LOGAN |

---

## MODULE BOUNDARY WARNINGS

1. `VportDashboardScreen.jsx` imports `useVportDashboardDetails` and `useProfilesOps` directly from `features/profiles/adapters/` — this is an adapter import, which is allowed, but the import path points deep into `profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter` rather than a single adapter barrel. If the profiles adapter reorganizes, this will break.
2. `vportOwnerStats.controller.js` imports `assertActorOwnsVportActorController` from `features/booking/adapters/booking.adapter` — cross-feature via adapter, which is correct.
3. `updateVportBooking.controller.js` imports `publishVcsmNotification` from `features/notifications/adapters/notifications.adapter` — cross-feature via adapter, which is correct.
4. Duplicate model directory: `apps/VCSM/src/features/dashboard/vport/screens/model/` contains legacy copies of `buildDashboardCards.model.js` and `dashboardViewByVportType.model.js`. The source comment in the canonical file notes the move but legacy files may still exist — stale model files are a maintenance risk.

---

## SPAGHETTI SCORE

**Module:** dashboard
**Score:** WATCH
**Reasons:** The module is large (258 source files, 12 sub-card systems) but is well-structured — each card lives in its own directory with its own controller/DAL/hook/model/screen stack. The primary concerns are: (1) BEHAVIOR.md is a stub, creating governance blindspot; (2) duplicate model files in `screens/model/` vs `vport/model/`; (3) deep cross-feature adapter import path in VportDashboardScreen. No layer violations detected, no raw cross-feature DAL imports found.
**Release risk:** MEDIUM

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — content is "Behavior contract pending source review."

**Check A (Source without behavior):** FAIL — Source is fully present (258 files) but BEHAVIOR.md contains no real contract.
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no documented happy paths to verify against source.
**Check C (§13 engine consistency):** PARTIAL — Scanner reports 12 engines; without a real BEHAVIOR.md §13 the comparison cannot be made. All 12 engines have confirmed imports visible in source (booking.adapter, notifications.adapter, media.adapter, profiles.adapter, etc.).
**Check D (§6 data change consistency):** PARTIAL — 37 write surfaces confirmed by scanner and verified by DAL source reads. Without a real BEHAVIOR.md §6, table-level cross-check cannot be performed.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md contract | 258-file module with 16 entry points, 37 write surfaces, and 12 engine dependencies has a placeholder behavior contract — highest governance gap | LOGAN |
| P2 | Register routes in route-map | 0 routes in scanner despite 16+ navigable entry points; route-map audit needed | HAWKEYE |
| P3 | Declare module ownership | No team/engineer on record as responsible for this module | IRONMAN |
| P4 | Remove or reconcile duplicate model files in `screens/model/` | Stale legacy copies of canonical model files create maintenance confusion | LOGAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — Write the real BEHAVIOR.md; reconcile duplicate model files in screens/model/
- **IRONMAN** — Declare ownership and feature responsibility record
- **HAWKEYE** — Audit route registration; confirm all 16+ dashboard routes are registered in the router
- **SENTRY** — Verify error state coverage across all 12 card sub-systems
- **KRAVEN** — Document cache strategy for bookings, team, and availability reads

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
