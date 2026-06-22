---
name: vcsm.dashboard.ownership
description: Feature ownership record for VCSM dashboard — produced by IRONMAN 2026-06-05
metadata:
  type: ownership
  owner: IRONMAN
  last-run: 2026-06-05
  ticket: IRONMAN-DASHBOARD-2026-06-05
  clarity: PARTIAL
---

# dashboard — Ownership Record

**Application Scope:** VCSM
**Ownership Clarity:** PARTIAL
**Last IRONMAN Run:** 2026-06-05
**Primary Gap:** No named engineering owner declared — must be filled in by engineering team.

---

## 1. Purpose

The dashboard feature is the VPORT owner control center for VCSM.

It provides:
- A card-based shell entry screen that dispatches VPORT owners to sub-module tools
- 12 card sub-module management surfaces (bookings, calendar, gas prices, team, leads, portfolio, reviews, schedule, services, exchange, locksmith, settings)
- The Design Studio — a canvas-based editor for building branded marketing flyers
- QR code generation for VPORT menus and review pages
- VPORT settings management (address, hours, social links, directory visibility)
- Flyer view and flyer builder screens

The feature owns no write surfaces at the shell level. All mutations are delegated to card sub-modules.

---

## 2. Application Scope

**VCSM**

Protected root: `apps/VCSM/src/features/dashboard/`

---

## 3. Code Roots

| Path | Purpose |
|---|---|
| `apps/VCSM/src/features/dashboard/vport/` | Shell, card sub-modules, ownership hooks, read/write DAL |
| `apps/VCSM/src/features/dashboard/flyerBuilder/` | Design Studio (canvas editor, page management, exports) |
| `apps/VCSM/src/features/dashboard/qrcode/` | QR code generation sub-system |
| `apps/VCSM/src/features/dashboard/shared/` | Shared diagnostics, types, utilities across sub-modules |

Total source files: 258

---

## 4. Core Layers

**DAL (94 files)**
Key files: `designStudio.write.dal.js`, `updateVportBooking.write.dal.js`, `vportFuelPrices.write.dal.js`, `vportLeads.write.dal.js`, `vportTeam.write.dal.js`
Split: read DAL (`vport/dal/read/`) + write DAL (`vport/dal/write/`) per sub-system

**Model (76 files)**
Key files: `buildDashboardCards.model.js`, `dashboardViewByVportType.model.js`, `dashboardVportDetails.model.js`, `gasPrices.model.js`, `vportBooking.model.js`, `vportSettingsDraft.model.js`

**Controller (75 files)**
Key files: `updateVportBooking.controller.js`, `checkVportOwnership.controller.js`, `vportOwnerStats.controller.js`, `flyerEditor.controller.js`, `settingsCoordinator.controller.js`, `scheduleBookingCoordinator.controller.js`

**Service (1 file)**
`fuelPriceCache.service.js` — in-memory cache for fuel price reads

**Adapter (2 files)**
`vport/adapters/vport.adapter.js` — vport domain barrel
`qrcode/adapters/qrcode.adapter.js` — QR code domain barrel

**Hook (42 files)**
Key files: `useVportOwnership.js`, `useOwnerQuickStats.js`, `useVportBookingActions.js`, `useVportGasPrices.js`, `useVportTeam.js`, `useVportLeads.js`, `useVportOwnerSchedule.js`, `useDesignStudio.js`

**Component (173 files)**
Key files: `VportDashboardParts.jsx`, `BookingCard.jsx`, `GasPricesPanel.jsx`, `ScheduleGrid.jsx`, `DesignStudioCanvasStage.jsx`

**Screen (17 files)**
- `VportDashboardScreen.jsx` — primary shell
- `VportDashboardBookingHistoryScreen.jsx`
- `VportDashboardCalendarScreen.jsx`
- `VportDashboardGasScreen.jsx`
- `VportDashboardTeamScreen.jsx`
- `VportDashboardLeadsScreen.jsx`
- `VportDashboardPortfolioScreen.jsx`
- `VportDashboardScheduleScreen.jsx`
- `VportDashboardServicesScreen.jsx`
- `VportDashboardReviewScreen.jsx`
- `VportDashboardLocksmithScreen.jsx`
- `VportDesignStudioViewScreen.jsx`
- `VportActorMenuFlyerScreen.jsx`
- `VportActorMenuFlyerEditorScreen.jsx`
- `VportSettingsScreen.jsx`
- `VportDashboardExchangeScreen.jsx`

---

## 5. Engines Used

| Engine | Approved Boundary | Usage |
|---|---|---|
| engines/availability | YES — via adapter | Calendar/schedule card — availability rules |
| engines/booking | YES — via booking.adapter | Ownership verification (assertActorOwnsVportActorController, getActorByIdDAL) |
| engines/hydration | YES — via adapter | Identity hydration |
| engines/identity | YES — via adapter | Actor resolution, actor_owners lookup |
| engines/lead | YES — via adapter | Leads card DAL |
| engines/media | YES — via media.adapter | Asset creation (flyerBuilder, portfolio) |
| engines/menu | YES — via adapter | Flyer and QR sub-systems |
| engines/notification | YES — via notifications.adapter | Booking update notifications |
| engines/portfolio | YES — via adapter | Portfolio card |
| engines/profile | YES — via profiles.adapter | Public VPORT profile reads (shell) |
| engines/qr | YES — via qrcode.adapter | QR code generation |
| engines/review | YES — via adapter | Reviews card |

---

## 6. Database / Schema Ownership

**Tables written (37 surfaces):**

| Schema | Table | Sub-system | Operations |
|---|---|---|---|
| default | bookings | dashboard/bookings + dashboard/vport | UPDATE (state), INSERT (new) |
| default | resources | dashboard/team | INSERT/UPDATE/DELETE (team members) |
| default | design_documents | dashboard/flyerBuilder | INSERT, UPDATE |
| default | design_pages | dashboard/flyerBuilder | INSERT, UPDATE, DELETE |
| default | design_page_versions | dashboard/flyerBuilder | INSERT, DELETE |
| default | design_assets | dashboard/flyerBuilder | INSERT |
| default | design_exports | dashboard/flyerBuilder | INSERT, DELETE |
| default | design_render_jobs | dashboard/flyerBuilder | INSERT, DELETE |
| default | fuel_prices | dashboard/gasprices | UPDATE, UPSERT |
| default | fuel_price_history | dashboard/gasprices | INSERT |
| default | fuel_price_submissions | dashboard/gasprices | INSERT, UPDATE |
| default | fuel_price_submission_reviews | dashboard/gasprices | INSERT, UPDATE |
| default | business_card_leads | dashboard/leads | UPDATE, DELETE |
| default | portfolio_media | dashboard/portfolio | UPDATE |
| vport | profile_public_details | dashboard/flyerBuilder + dashboard/settings | UPSERT ×2 |

**Views:** None declared
**RPCs:** None declared
**RLS policies:** UNKNOWN for most tables — CARNAGE + TICKET-PLATFORM-RLS-001 open
**Migration owner:** CARNAGE (per governance chain)

---

## 7. Rule Ownership

| Rule | Owner | Enforcement Layer | Risk |
|---|---|---|---|
| Actor must own the VPORT to access dashboard | booking engine (assertActorOwnsVportActorController) | Controller via booking.adapter | MEDIUM — no declared authority |
| Route-level identity match (UI gate) | dashboard (OwnerOnlyDashboardGuard) | Route guard (app/routes/protected/) | LOW — self-documented as UI convenience |
| Screen-level ownership re-verify | dashboard (useVportOwnership) | Screen hook | LOW — fail-closed |
| Booking terminal state guard | dashboard/bookings (updateVportBooking.controller) | Controller | LOW |
| Flyer public details write authorization | dashboard/flyerBuilder | Controller only (no DAL backstop) | HIGH — VEN-DASHBOARD-001 open |
| VPORT settings write authorization | dashboard/settings | Controller + actor_owners | HIGH — VEN-DASHBOARD-002 open |
| Card sub-module write authorization | UNVERIFIED for 8 cards | UNKNOWN | HIGH — VEN-SHELL-002 THOR BLOCKER |
| Void VPORT self-access bypass denial | booking engine (checkVportOwnership) | Controller | LOW |

---

## 8. Contracts Touched

| Contract | Status |
|---|---|
| Actor Ownership Contract | ACTIVE — enforced; multi-layer ownership ambiguity (OWN-DSH-002) |
| Boundary Isolation Contract | COMPLIANT — all cross-feature access via approved adapters |
| Architecture Contract | COMPLIANT — engine/app boundary respected |
| Booking Contract | PARTIAL — terminal state guard confirmed; booking INSERT ownership gap open |
| Feed Publishing Contract | PARTIAL — vport.profile_public_details write ownership split (OWN-DSH-004) |

---

## 9. Documentation Links

| Doc | Path | Status |
|---|---|---|
| Feature BEHAVIOR.md | ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md | ACTIVE (2026-06-05 — WOLVERINE Phase 2) |
| Feature ARCHITECTURE.md | ZZnotforproduction/APPS/VCSM/features/dashboard/ARCHITECTURE.md | ACTIVE (2026-06-04) |
| Feature CURRENT_STATUS.md | ZZnotforproduction/APPS/VCSM/features/dashboard/CURRENT_STATUS.md | ACTIVE (2026-06-04) |
| Feature SECURITY.md | ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md | ACTIVE (2026-06-05) |
| Feature SCREENS.md | ZZnotforproduction/APPS/VCSM/features/dashboard/SCREENS.md | ACTIVE |
| Shell module BEHAVIOR.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/BEHAVIOR.md | ACTIVE (2026-06-05) |
| Shell module ARCHITECTURE.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/ARCHITECTURE.md | ACTIVE (2026-06-05) |
| Shell module SECURITY.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/SECURITY.md | ACTIVE (2026-06-05) |
| Security audit (VENOM feature) | ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/04/Venom/ | COMPLETE (2026-06-04) |
| Security audit (VENOM shell) | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/Venom/ | COMPLETE (2026-06-05) |
| Security audit (BLACKWIDOW shell) | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/BlackWidow/ | COMPLETE (2026-06-05) |
| Security audit (ELEKTRA shell) | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/ELEKTRA/ | COMPLETE (2026-06-05) |
| IRONMAN ownership report | ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/IRONMAN/2026-06-05_ironman_dashboard.md | COMPLETE (2026-06-05) |

---

## 10. Runtime Ownership

**Entry points (16+):**
`/actor/:actorId/dashboard` → VportDashboardScreen (shell dispatch)
`/actor/:actorId/dashboard/*` → 12 card sub-module screens
`/actor/:actorId/menu/flyer[/edit]` → flyerBuilder screens
`/actor/:actorId/menu/qr` → QR screen
`/actor/:actorId/settings` → delegated to settings feature

**Key controllers (runtime hot paths):**
- `checkVportOwnership.controller.js` — runs on every shell mount + window focus/visibility change
- `updateVportBooking.controller.js` — booking state mutations with terminal state guard
- `submitFuelPriceSuggestion.controller.js` / `reviewFuelPriceSuggestion.controller.js` — crowd-source flow
- `settingsCoordinator.controller.js` — public VPORT profile writes

**Known bottlenecks:** Ownership check fires on every focus/visibilitychange event (no debounce documented). Fuel price cache is the only explicit cache strategy.

---

## 11. Responsibilities

The dashboard feature is responsible for:

1. Verifying actor ownership before any dashboard sub-module renders or accepts writes
2. Building and rendering the VPORT-type-specific card catalog
3. Dispatching the actor to the appropriate sub-module via imperative navigation
4. Managing all VPORT owner data operations: bookings, team, gas prices, leads, portfolio, settings, reviews, schedule, exchange, services, locksmith
5. Rendering the Design Studio (canvas flyer editor)
6. Generating QR codes for VPORT menu and review pages
7. Maintaining VPORT public profile details (directory visibility, flyer links, address, hours)
8. Enforcing screen-level and controller-level ownership on all write surfaces

---

## 12. Boundaries

The dashboard feature must NOT:

- Import from another feature without going through an approved adapter
- Write to tables owned by other features without an engine adapter boundary
- Implement the authoritative ownership check logic (that belongs in engines/booking via assertActorOwnsVportActorController)
- Make direct DB calls bypassing the engine adapter pattern
- Render public-facing pages — the dashboard is owner-only; public profiles belong to the profiles feature
- Own the routing configuration — route registration belongs in the app-level router (`app.routes.jsx`)
- Treat the OwnerOnlyDashboardGuard as an authoritative security boundary (it is a UI convenience layer only)

---

## 13. Change Impact Rules

Any change to the dashboard feature requires updating:

| Area | What to Update | Commands |
|---|---|---|
| Write surfaces (bookings, team, fuel prices, etc.) | SECURITY.md (VENOM/ELEKTRA), BEHAVIOR.md, DATA CONTRACT | VENOM, ELEKTRA, LOGAN |
| Ownership check path (useVportOwnership, assertActorOwnsVportActorController) | SECURITY.md, ARCHITECTURE.md, BEHAVIOR.md | VENOM, BLACKWIDOW, ELEKTRA |
| Card catalog (new card, removed card, locked state) | BEHAVIOR.md (shell module), ARCHITECTURE.md | LOGAN, ARCHITECT |
| Engine dependencies (add/remove engine) | ARCHITECTURE.md, OWNERSHIP.md §5, BEHAVIOR.md | ARCHITECT, IRONMAN |
| vport.profile_public_details schema | ARCHITECTURE.md, SECURITY.md, OWNERSHIP.md §6 | ARCHITECT, VENOM, CARNAGE |
| Route registration | ARCHITECTURE.md, SCREENS.md, route-map scanner | ARCHITECT, HAWKEYE |
| Card sub-module authorization patterns | SECURITY.md (feature + module) | VENOM, BLACKWIDOW |

---

## 14. Release Gate Notes

**THOR Status:** BLOCKED

| Blocker | Type | Source |
|---|---|---|
| VEN-SHELL-002 (HIGH) | Security — card sub-module ownership unverified for 8 cards | VENOM 2026-06-05 |
| OWN-DSH-001 (HIGH) | Ownership — no declared feature owner | IRONMAN 2026-06-05 |
| OWN-DSH-002 (HIGH) | Ownership — Actor Ownership Contract has no declared authority | IRONMAN 2026-06-05 |

**THOR CAUTION (not blocking):**

| Finding | Type | Source |
|---|---|---|
| Feature-level BEHAVIOR.md is a stub | Documentation | ARCHITECT 2026-06-04 |
| VEN-DASHBOARD-001 (MEDIUM) | Security — flyer write, controller-only ownership gate | VENOM 2026-06-04 |
| VEN-DASHBOARD-002 (MEDIUM) | Security — dual ownership model inconsistency | VENOM 2026-06-04 |
| OWN-DSH-004 (MEDIUM) | Ownership — vport.profile_public_details split write path | IRONMAN 2026-06-05 |

---

## 15. Open Ownership Questions

| Question | Priority |
|---|---|
| Who is the named engineering owner for the dashboard feature? | P1 — required for THOR gate |
| Which team/engineer owns the Actor Ownership Contract enforcement for dashboard? | P1 — required for THOR gate |
| Who owns the getActorByIdDAL migration ticket? | P2 |
| What RLS policies protect the design_* tables? | P2 — TICKET-PLATFORM-RLS-001 |
| Who owns the canonical copy decision for duplicate model files in screens/model/? | P3 |
