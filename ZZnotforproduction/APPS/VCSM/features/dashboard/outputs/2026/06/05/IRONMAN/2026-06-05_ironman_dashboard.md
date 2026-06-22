---
title: IRONMAN Ownership Report — dashboard
command: IRONMAN
scope: VCSM / features / dashboard
generated: 2026-06-05
architect-gate: PASS (2026-06-04, age 1 day)
---

# IRONMAN OWNERSHIP REPORT — dashboard

**Date:** 2026-06-05
**Application Scope:** VCSM
**Boundary Contract:** Loaded — ZZnotforproduction/CONTRACTS/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md

---

## ARCHITECT GATE

| Requirement | Status | Detail |
|---|---|---|
| Report exists | PASS | ZZnotforproduction/APPS/VCSM/features/dashboard/ARCHITECTURE.md |
| Report status = SUCCESS | PASS | Run completed; all sections present (MOSTLY COMPLETE) |
| Freshness ≤ 7 days | PASS | 2026-06-04 — age: 1 day |
| Scope matches | PASS | Scope = VCSM:dashboard feature |

IRONMAN ARCHITECT GATE: **PASS**

Upstream report: `ZZnotforproduction/APPS/VCSM/features/dashboard/ARCHITECTURE.md`
Scope: VCSM / dashboard feature
Date: 2026-06-04
Age: 1 day

---

## Step 1 — Target

```
IRONMAN TARGET
Feature: dashboard
Application Scope: VCSM
Reason: No OWNERSHIP.md exists. ARCHITECT 2026-06-04 explicitly listed IRONMAN as P3 handoff:
        "No team or engineer is on record as owning this module."
        258 source files, 12 sub-systems, 37 write surfaces, 12 engine dependencies — fully unmapped ownership.
```

---

## Step 2 — Code Roots

```
CODE ROOTS
Primary path:     apps/VCSM/src/features/dashboard/
Sub-directories:
  vport/          — shell, card sub-modules (bookings, calendar, gasprices, leads, portfolio, reviews,
                    schedule, services, settings, team, exchange, locksmith)
  flyerBuilder/   — Design Studio (canvas editor, page management, asset exports)
  qrcode/         — QR code generation
  shared/         — diagnostics, shared types across sub-modules

Entry files:
  apps/VCSM/src/features/dashboard/vport/screens/VportDashboardScreen.jsx   — primary shell entry
  apps/VCSM/src/features/dashboard/vport/adapters/vport.adapter.js          — vport adapter barrel
  apps/VCSM/src/features/dashboard/qrcode/adapters/qrcode.adapter.js        — QR adapter barrel
  apps/VCSM/src/features/dashboard/[card]/index.js (×12)                    — card sub-module barrels
  apps/VCSM/src/features/dashboard/flyerBuilder/index.js                    — Design Studio barrel
```

---

## Step 3 — Layer Map

```
LAYER MAP
DAL (94 files):
  designStudio.write.dal.js         — Design Studio write operations (12 design tables)
  updateVportBooking.write.dal.js   — booking state mutations
  vportFuelPrices.write.dal.js      — fuel price UPSERT/UPDATE
  vportLeads.write.dal.js           — leads UPDATE/DELETE
  vportTeam.write.dal.js            — team member CRUD
  vport/dal/read/ (×10)             — read DAL files per sub-system
  Plus DAL files in each of 12 card sub-module directories

Model (76 files):
  buildDashboardCards.model.js         — card catalog (17 cards), locked logic, builder
  dashboardViewByVportType.model.js    — 8 view presets, type-to-view, calendar injection, release flags
  dashboardVportDetails.model.js       — VPORT public profile normalizer
  gasPrices.model.js                   — fuel price model
  vportBooking.model.js                — booking model and state machine
  vportSettingsDraft.model.js          — settings draft model
  designStudioMapper.model.js          — canvas scene mapper
  designStudioScene.model.js           — canvas scene model
  vportAvailabilityRule.model.js       — availability rule model
  (+ 67 additional model files)

Controller (75 files):
  updateVportBooking.controller.js     — booking state transitions
  vportOwnerStats.controller.js        — owner stats read (today bookings, upcoming, active barbers)
  flyerEditor.controller.js            — flyer editor orchestration
  settingsCoordinator.controller.js    — settings write coordinator
  scheduleBookingCoordinator.controller.js — schedule booking orchestration
  checkVportOwnership.controller.js    — ownership resolution (self-access bypass + actor_owners)
  assertActorOwnsVportActor.controller.js (via booking.adapter) — ownership assertion
  submitFuelPriceSuggestion.controller.js
  reviewFuelPriceSuggestion.controller.js
  (+ 66 additional controller files across 12 card sub-modules)

Service (1 file):
  fuelPriceCache.service.js    — in-memory cache for fuel price reads

Adapter (2 files):
  vport.adapter.js             — vport domain barrel (owned by dashboard/vport)
  qrcode.adapter.js            — QR code domain barrel (owned by dashboard/qrcode)

Hook (42 files):
  useVportOwnership.js         — async ownership check + focus/visibility re-verify
  useOwnerQuickStats.js        — owner stats hook (consumer unknown — not called from shell)
  useVportBookingActions.js    — booking action hooks
  useVportGasPrices.js         — gas price hooks
  useVportTeam.js              — team hooks
  useVportLeads.js             — leads hooks
  useVportOwnerSchedule.js     — schedule hooks
  useDesignStudio.js           — Design Studio hooks
  useDesignStudioExports.js    — Design Studio export hooks
  useDesignStudioSceneActions.js — canvas scene hooks
  usePortfolioItemSubmit.js    — portfolio media hooks
  useBarberTeamRequests.js     — barber team request hooks
  (+ 30 additional hooks)

Component (173 files):
  VportDashboardParts.jsx      — dashboard card grid container
  BookingCard.jsx              — booking card display
  OperationalBookingCard.jsx   — operational booking display
  GasPricesPanel.jsx           — gas prices UI
  ScheduleGrid.jsx             — schedule grid display
  DesignStudioCanvasStage.jsx  — Design Studio canvas
  (+ 167 additional components)

Screen (17 files):
  VportDashboardScreen.jsx                 — shell entry screen
  VportDashboardBookingHistoryScreen.jsx   — bookings card screen
  VportDashboardCalendarScreen.jsx         — calendar card screen
  VportDashboardGasScreen.jsx             — gas prices card screen
  VportDashboardTeamScreen.jsx            — team card screen
  VportDashboardLeadsScreen.jsx           — leads card screen
  VportDashboardPortfolioScreen.jsx       — portfolio card screen
  VportDashboardScheduleScreen.jsx        — schedule card screen
  VportDashboardServicesScreen.jsx        — services card screen
  VportDashboardReviewScreen.jsx          — reviews card screen
  VportDashboardLocksmithScreen.jsx       — locksmith card screen
  VportDesignStudioViewScreen.jsx         — Design Studio view screen
  VportActorMenuFlyerScreen.jsx           — flyer view screen
  VportActorMenuFlyerEditorScreen.jsx     — flyer editor screen
  VportSettingsScreen.jsx                 — settings screen (delegates to settings feature)
  VportDashboardExchangeScreen.jsx        — exchange rates screen
  (+ additional screens)
```

---

## Step 4 — External Dependencies

```
DEPENDENCY OWNERSHIP
Engines used (×12 — all inbound, all boundary-approved):
  engines/availability   — calendar/schedule cards
  engines/booking        — booking.adapter: assertActorOwnsVportActorController, getActorByIdDAL
  engines/hydration      — identity hydration
  engines/identity       — actor resolution, actor_owners lookup
  engines/lead           — lead DAL in leads card
  engines/media          — media.adapter: createMediaAssetController (flyerEditor, portfolio)
  engines/menu           — menu flyer and QR sub-systems
  engines/notification   — notifications.adapter: publishVcsmNotification (booking updates)
  engines/portfolio      — portfolio card
  engines/profile        — profiles.adapter: useVportDashboardDetails, useProfilesOps
  engines/qr             — QR code generation
  engines/review         — reviews card

Cross-feature (all via adapter boundary — approved):
  features/profiles      → profiles.adapter (useVportDashboardDetails, useProfilesOps)
  features/booking       → booking.adapter (assertActorOwnsVportActorController, getActorByIdDAL)
  features/notifications → notifications.adapter (publishVcsmNotification)
  features/media         → media.adapter (createMediaAssetController)

External services: None directly — all external calls go through engine adapters
```

---

## Step 5 — Data Ownership

```
DATA OWNERSHIP
Tables written (37 surfaces — full list in INDEX.md write surface map):
  bookings                      — UPDATE (state) + INSERT (new booking) — booking engine co-owns
  resources                     — INSERT/UPDATE/DELETE (team members) — availability engine co-owns
  design_documents              — INSERT/UPDATE
  design_pages                  — INSERT/UPDATE/DELETE
  design_page_versions          — INSERT/UPDATE/DELETE
  design_assets                 — INSERT
  design_exports                — INSERT/DELETE
  design_render_jobs            — INSERT/DELETE
  fuel_prices                   — UPDATE/UPSERT
  fuel_price_history            — INSERT
  fuel_price_submissions        — INSERT/UPDATE
  fuel_price_submission_reviews — INSERT/UPDATE
  business_card_leads           — UPDATE/DELETE
  portfolio_media               — UPDATE
  vport.profile_public_details  — UPSERT ×2 (flyer path + settings path)

Tables read (via read DAL + engine adapters):
  actors, actor_owners          — via booking.adapter identity check
  bookings                      — read DAL in bookings card
  resources                     — read DAL in team card
  fuel_prices, fuel_price_submissions — read DAL in gas card
  business_card_leads           — read DAL in leads card
  portfolio_media               — read DAL in portfolio card
  vport.profile_public_details  — read DAL in vport shell
  availability_rules            — via availability engine

Identity surfaces: actor_owners (ownership verification at controller layer)
Caches: fuelPriceCache.service.js (in-memory, fuel price reads only)
```

---

## Step 6 — Governance Ownership

```
GOVERNANCE OWNERSHIP
Contracts touched:
  Actor Ownership Contract     — useVportOwnership (UI) + assertActorOwnsVportActorController (controller)
  Boundary Isolation Contract  — all cross-feature access via approved adapters
  Architecture Contract        — engine dependency boundaries, cross-feature import rules
  Booking Contract             — terminal state guard on bookings UPDATE; booking INSERT validation
  Feed Publishing Contract     — vport.profile_public_details UPSERT (public-facing directory visibility)

Logan docs:
  ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md         — PRESENT (STUB — not a real contract)
  ZZnotforproduction/APPS/VCSM/features/dashboard/ARCHITECTURE.md     — PRESENT (2026-06-04)
  ZZnotforproduction/APPS/VCSM/features/dashboard/CURRENT_STATUS.md   — PRESENT (2026-06-04)
  ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md         — PRESENT (2026-06-05)
  ZZnotforproduction/APPS/VCSM/features/dashboard/SCREENS.md          — PRESENT

Module-level docs (shell):
  ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/BEHAVIOR.md    — ACTIVE (2026-06-05)
  ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/ARCHITECTURE.md — ACTIVE (2026-06-05)
  ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/SECURITY.md   — ACTIVE (2026-06-05)

Security audits:
  VENOM:      feature (2026-06-04) + shell module (2026-06-05) — 12 total findings
  BLACKWIDOW: feature (2026-06-04) + shell module (2026-06-05) — 8 total findings
  ELEKTRA:    shell module (2026-06-05) — 2 LOW + 1 INFO

Architecture maps: ARCHITECTURE.md (feature) + ARCHITECTURE.md (shell module)
```

---

## Step 7 — Ownership Findings

### IRONMAN OWNERSHIP FINDING OWN-DSH-001

```
Finding ID: OWN-DSH-001
Feature / Engine: dashboard
Application Scope: VCSM
Responsibility Type: Feature ownership
Ownership Clarity: MISSING
Boundary Risk: HIGH
Severity: HIGH

Primary code roots: apps/VCSM/src/features/dashboard/
Core layers: All (DAL 94, Model 76, Controller 75, Hook 42, Component 173, Screen 17)
Engines used: 12 (availability, booking, hydration, identity, lead, media, menu, notification, portfolio, profile, qr, review)
Tables / Objects touched: 37 write surfaces across bookings, resources, design_*, fuel_*, leads, portfolio_media, vport.profile_public_details
Rule ownership: Actor ownership rule (multi-layer enforcement)
Contracts touched: Actor Ownership Contract, Booking Contract, Feed Publishing Contract, Boundary Isolation Contract
Docs touched: BEHAVIOR.md (STUB), ARCHITECTURE.md, SECURITY.md, CURRENT_STATUS.md

Current ambiguity: No engineer, team, or governance entity is declared as responsible for the dashboard feature.
  258-file module with 37 write surfaces and 12 engine dependencies has no recorded owner.
  The ARCHITECT report explicitly listed this as "No team or engineer is on record."

Risk: THOR cannot gate a release when the feature has no declared owner.
  Any change to a write surface (bookings, public profile, team members) has no accountable authority.

Recommended ownership clarification:
  Declare VCSM:dashboard as a first-class feature with a named engineering owner or team.
  Record in OWNERSHIP.md and propagate to CURRENT_STATUS.md IRONMAN section.

Recommended handoff: THOR (release blocker until ownership is declared)
Rationale: A 258-file feature with 37 write surfaces, auth enforcement layers,
  and public-facing data mutations requires a documented owner for release governance.
```

---

### IRONMAN OWNERSHIP FINDING OWN-DSH-002

```
Finding ID: OWN-DSH-002
Feature / Engine: dashboard
Application Scope: VCSM
Responsibility Type: Security ownership
Ownership Clarity: PARTIAL
Boundary Risk: HIGH
Severity: HIGH

Primary code roots:
  apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx (OwnerOnlyDashboardGuard)
  apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js
  apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js (via booking.adapter)

Core layers: Controller (assertActorOwnsVportActor), Hook (useVportOwnership), Route guard (OwnerOnlyDashboardGuard)
Tables: actor_owners, actors (ownership verification reads)
Rule ownership: Actor ownership rule for dashboard access
Contracts touched: Actor Ownership Contract

Current ambiguity:
  The actor ownership rule for dashboard access is enforced at 3 separate layers:
    (1) OwnerOnlyDashboardGuard — route-level, UI convenience, self-documented as "not authoritative"
    (2) useVportOwnership — screen-level async check, fail-closed
    (3) assertActorOwnsVportActorController — controller-level (lives in booking feature, consumed via adapter)
  No single owner is declared for this rule chain. The authoritative enforcement layer is the controller,
  but the controller lives in the booking feature domain, not the dashboard feature domain.
  VENOM VEN-SHELL-002 (HIGH THOR BLOCKER) is unresolved: card sub-modules must independently verify,
  but no owner is declared for ensuring they do.

Risk: If the booking feature refactors assertActorOwnsVportActorController, the dashboard's
  primary ownership enforcement may silently change. No declared owner means no alert path.

Recommended ownership clarification:
  The Actor Ownership Contract must declare VCSM:identity or engines/booking as the authoritative owner
  of assertActorOwnsVportActorController. The dashboard feature owns the consumption contract (useVportOwnership)
  and is responsible for ensuring all card sub-modules call the authoritative ownership check.

Recommended handoff: HAWKEYE (route auth contract), SENTRY (boundary compliance), VENOM (re-run after ARCHITECT card audit)
Rationale: Multi-layer ownership of a security rule with no declared authority is a HIGH governance risk.
```

---

### IRONMAN OWNERSHIP FINDING OWN-DSH-003

```
Finding ID: OWN-DSH-003
Feature / Engine: dashboard + booking (cross-feature)
Application Scope: VCSM
Responsibility Type: DAL ownership
Ownership Clarity: AMBIGUOUS
Boundary Risk: MEDIUM
Severity: MEDIUM

Primary code roots:
  apps/VCSM/src/features/booking/adapters/booking.adapter.js
  apps/VCSM/src/features/booking/dal/getActorById.dal.js

Current ambiguity:
  booking.adapter.js exports getActorByIdDAL (a DAL from the booking feature domain).
  The dashboard shell consumes this via the adapter:
    checkVportOwnership.controller.js → booking.adapter → getActorByIdDAL
  However, getActorByIdDAL is a generic actor-lookup DAL that arguably belongs in @/shared/dal/actor/
  rather than as a booking-domain export.
  ELEKTRA finding ELEK-2026-06-05-002 flagged this as a domain boundary violation.
  No migration ticket has been assigned an owner for the move.

Risk: The booking feature owns a DAL that the dashboard depends on but that
  conceptually belongs in the shared layer. If the booking DAL is removed or changed,
  dashboard ownership verification silently breaks.

Recommended ownership clarification:
  Assign migration ownership to a specific ticket (TICKET-DAL-ACTOR-SHARED-001 recommended).
  Interim: booking feature remains the owner of record; dashboard feature
  acknowledges the adapter boundary as a documented cross-domain dependency.

Recommended handoff: WOLVERINE (migration ticket), SENTRY (boundary enforcement)
Rationale: Ambiguous DAL ownership across feature boundaries with an outstanding migration path
  should have a declared owner before the next release.
```

---

### IRONMAN OWNERSHIP FINDING OWN-DSH-004

```
Finding ID: OWN-DSH-004
Feature / Engine: dashboard
Application Scope: VCSM
Responsibility Type: Data ownership
Ownership Clarity: PARTIAL
Boundary Risk: MEDIUM
Severity: MEDIUM

Primary code roots:
  apps/VCSM/src/features/dashboard/vport/dal/write/  (saveFlyerPublicDetails, upsertVportPublicDetailsDAL)
  apps/VCSM/src/features/dashboard/flyerBuilder/

Current ambiguity:
  vport.profile_public_details is written from two separate sub-systems:
    (1) dashboard/flyerBuilder — saveFlyerPublicDetails (flyer public link, title)
    (2) dashboard/vport/settings — upsertVportPublicDetailsDAL (VPORT settings: address, hours, social links, etc.)
  These are the same table. No declared owner for the write contract on this table.
  VENOM VEN-DASHBOARD-002 flagged inconsistent ownership model:
    actor_owners check at controller layer vs owner_user_id filter at DAL layer.

Risk: Two write paths to a public-facing table (used for directory discoverability)
  with no declared arbitrator creates a risk of conflicting writes and divergent
  ownership enforcement.

Recommended ownership clarification:
  Declare dashboard/vport as the write owner of vport.profile_public_details.
  Both sub-systems (flyerBuilder and settings) should route through a single
  canonical write controller that owns the ownership check.

Recommended handoff: CARNAGE (migration — consolidate write path), VENOM (re-run after controller consolidation)
Rationale: Split write ownership of a public-facing identity table is a governance risk.
```

---

### IRONMAN OWNERSHIP FINDING OWN-DSH-005

```
Finding ID: OWN-DSH-005
Feature / Engine: dashboard
Application Scope: VCSM
Responsibility Type: Documentation ownership
Ownership Clarity: MISSING
Boundary Risk: LOW
Severity: MEDIUM

Current ambiguity:
  Feature-level BEHAVIOR.md is a STUB: "Behavior contract pending source review."
  A 258-file feature with 37 write surfaces, 12 engine dependencies, and 16 entry points
  has no documented behavior contract at the feature level.
  The shell-module BEHAVIOR.md was completed 2026-06-05 (TICKET-ARCHITECT-BEHAVIOR-REVERSE-0001),
  but that covers only the dashboard shell — not the 11 card sub-modules, Design Studio,
  QR system, or flyer builder.

Risk: THOR cannot assess release readiness for a feature with no behavior contract.
  Changes to any of the 37 write surfaces have no documented expected behavior to
  compare against.

Recommended ownership clarification:
  Assign a LOGAN ticket to build the feature-level BEHAVIOR.md from source.
  Priority: P1 governance gap per ARCHITECT 2026-06-04.

Recommended handoff: LOGAN
Rationale: Feature-level behavior contract is required for THOR gate and all downstream commands.
```

---

### IRONMAN OWNERSHIP FINDING OWN-DSH-006

```
Finding ID: OWN-DSH-006
Feature / Engine: dashboard
Application Scope: VCSM
Responsibility Type: Documentation ownership
Ownership Clarity: MISSING
Boundary Risk: LOW
Severity: LOW

Current ambiguity:
  Route registration for all 16+ dashboard routes is not captured in the scanner route-map.
  The routes are confirmed in source (app.routes.jsx) but the scanner returns 0 routes.
  No declared owner for ensuring the scanner route-map covers these routes.

Risk: All downstream commands that rely on route-map (HAWKEYE, SPIDER-MAN, security scanners)
  will continue to miss dashboard routes until the route-map scanner is updated.

Recommended ownership clarification:
  HAWKEYE run required to audit route registration and update scanner route-map scope.

Recommended handoff: HAWKEYE
```

---

### IRONMAN OWNERSHIP FINDING OWN-DSH-007

```
Finding ID: OWN-DSH-007
Feature / Engine: dashboard
Application Scope: VCSM
Responsibility Type: Feature ownership
Ownership Clarity: AMBIGUOUS
Boundary Risk: LOW
Severity: LOW

Current ambiguity:
  Duplicate model files exist:
    apps/VCSM/src/features/dashboard/vport/screens/model/buildDashboardCards.model.js (LEGACY)
    apps/VCSM/src/features/dashboard/vport/screens/model/dashboardViewByVportType.model.js (LEGACY)
    vs.
    apps/VCSM/src/features/dashboard/vport/model/buildDashboardCards.model.js (CANONICAL)
    apps/VCSM/src/features/dashboard/vport/model/dashboardViewByVportType.model.js (CANONICAL)
  No declared owner for removing the legacy copies.

Recommended handoff: LOGAN (cleanup)
```

---

## Responsibility Classification

RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | dashboard (VCSM) | PARTIAL | No named engineer/team declared |
| Engine ownership | engines/booking, engines/profile, etc. | CLEAR | All engine adapters are boundary-approved |
| DAL ownership | dashboard sub-systems | PARTIAL | booking.adapter getActorByIdDAL is cross-domain ambiguity |
| Controller ownership | dashboard (per sub-module) | CLEAR | 75 controllers, each sub-module owns its controllers |
| UI ownership | dashboard (per sub-module) | CLEAR | 173 components, 17 screens, clear sub-module structure |
| Runtime ownership | dashboard shell | CLEAR | Inferred from source; LOKI run not performed |
| Data ownership | dashboard (per table) | PARTIAL | vport.profile_public_details has split write paths |
| Contract ownership | Actor Ownership Contract | AMBIGUOUS | Enforced in 3 layers; authoritative layer is booking-domain |
| Documentation ownership | MISSING | LOW | Feature-level BEHAVIOR.md is a stub |
| Security ownership | VENOM/ELEKTRA/BLACKWIDOW | CLEAR | Security command chain completed 2026-06-05 |
| Migration ownership | UNASSIGNED | LOW | getActorByIdDAL migration has no ticket owner |
| Native parity ownership | N/A | N/A | React web PWA only |

---

## Cross-Root Ownership Review

CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| getActorByIdDAL | dashboard (consumer) | booking feature (producer) | VIA ADAPTER — APPROVED | Consumed via booking.adapter; owner is booking feature |
| assertActorOwnsVportActorController | booking feature | booking feature | VIA ADAPTER — APPROVED | Dashboard consumes via booking.adapter |
| publishVcsmNotification | notification feature | notification feature | VIA ADAPTER — APPROVED | Dashboard consumes via notifications.adapter |
| createMediaAssetController | media feature | media feature | VIA ADAPTER — APPROVED | Dashboard consumes via media.adapter |
| useVportDashboardDetails / useProfilesOps | profiles feature | profiles feature | VIA ADAPTER — APPROVED | Dashboard consumes via profiles.adapter |
| OwnerOnlyDashboardGuard | dashboard routes | app/routes/protected/ | CROSS-LAYER — NOTE | Guard lives in app routes, not dashboard feature root; acceptable — route guards are app-level by design |

No cross-root boundary violations detected.

---

## Ownership Boundary Risk

OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| No declared feature owner | HIGH | 258-file feature with 37 write surfaces has no named engineering owner | Declare owner in OWNERSHIP.md; propagate to CURRENT_STATUS.md |
| Actor ownership rule — 3 enforcement layers, no declared authority | HIGH | Dashboard security depends on booking-domain controller; no owner declared for ensuring consistency | Declare Actor Ownership Contract authority in governance docs |
| vport.profile_public_details — split write paths | MEDIUM | Two sub-systems write to same public table with inconsistent ownership checks | Consolidate write path; declare single controller as owner |
| getActorByIdDAL cross-domain DAL export | MEDIUM | DAL lives in booking feature but belongs in shared; migration unowned | Create WOLVERINE migration ticket with declared owner |
| Feature-level BEHAVIOR.md stub | MEDIUM | No behavior contract for THOR gating | LOGAN ticket for feature-level BEHAVIOR.md |
| Scanner route-map gap | LOW | 16+ routes not in scanner | HAWKEYE run |
| Duplicate model files | LOW | Legacy copies create maintenance risk | LOGAN cleanup |

---

## Data Ownership Registry

DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| bookings | engines/booking | dashboard/bookings, booking engine | dashboard/bookings (UPDATE), dashboard/vport (INSERT) | booking engine | CARNAGE | dashboard/bookings |
| resources | dashboard/team | dashboard/team, engines/availability | dashboard/team | UNKNOWN | CARNAGE | dashboard/team |
| design_documents | dashboard/flyerBuilder | dashboard/flyerBuilder | dashboard/flyerBuilder | UNKNOWN | CARNAGE | dashboard/flyerBuilder |
| design_pages | dashboard/flyerBuilder | dashboard/flyerBuilder | dashboard/flyerBuilder | UNKNOWN | CARNAGE | dashboard/flyerBuilder |
| design_page_versions | dashboard/flyerBuilder | dashboard/flyerBuilder | dashboard/flyerBuilder | UNKNOWN | CARNAGE | dashboard/flyerBuilder |
| design_assets | dashboard/flyerBuilder | dashboard/flyerBuilder | dashboard/flyerBuilder | UNKNOWN | CARNAGE | dashboard/flyerBuilder |
| design_exports | dashboard/flyerBuilder | dashboard/flyerBuilder | dashboard/flyerBuilder | UNKNOWN | CARNAGE | dashboard/flyerBuilder |
| design_render_jobs | dashboard/flyerBuilder | dashboard/flyerBuilder | dashboard/flyerBuilder | UNKNOWN | CARNAGE | dashboard/flyerBuilder |
| fuel_prices | dashboard/gasprices | dashboard/gasprices | dashboard/gasprices | UNKNOWN | CARNAGE | dashboard/gasprices |
| fuel_price_history | dashboard/gasprices | dashboard/gasprices | dashboard/gasprices | UNKNOWN | CARNAGE | dashboard/gasprices |
| fuel_price_submissions | dashboard/gasprices | dashboard/gasprices | dashboard/gasprices | UNKNOWN | CARNAGE | dashboard/gasprices |
| fuel_price_submission_reviews | dashboard/gasprices | dashboard/gasprices | dashboard/gasprices | UNKNOWN | CARNAGE | dashboard/gasprices |
| business_card_leads | dashboard/leads | dashboard/leads | dashboard/leads | UNKNOWN | CARNAGE | dashboard/leads |
| portfolio_media | dashboard/portfolio | dashboard/portfolio, engines/portfolio | dashboard/portfolio | UNKNOWN | CARNAGE | dashboard/portfolio |
| vport.profile_public_details | SPLIT — flyer + settings | dashboard/vport shell, public profile | dashboard/flyerBuilder (flyer path) + dashboard/settings (settings path) | UNKNOWN | CARNAGE | MISSING |
| actors | engines/identity | dashboard (via booking.adapter) | engines/identity | identity engine | CARNAGE | engines/identity |
| actor_owners | engines/identity | dashboard ownership checks | engines/identity | identity engine | CARNAGE | engines/identity |

---

## Rule Ownership Registry

RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Actor must be VPORT-kind to access dashboard | booking engine (via adapter) | Controller (assertActorOwnsVportActor) | actor_owners table | MEDIUM — no single documented owner |
| Actor must match URL actorId for dashboard access | dashboard (route guard) | Route (OwnerOnlyDashboardGuard) + Screen (useVportOwnership) | OwnerOnlyDashboardGuard self-doc | MEDIUM — UI convenience, not authoritative |
| VPORT must not be void for self-access bypass | booking engine (via adapter) | Controller (checkVportOwnership) | checkVportOwnership.controller.js | LOW — source-verified |
| Booking terminal state guard | dashboard/bookings | Controller (updateVportBooking) | VPD-V-021 comment in controller | LOW — confirmed in source |
| Booking owner/customer cancel authorization | dashboard/bookings | Controller (updateVportBooking) | BEHAVIOR contract (partial) | MEDIUM — VENOM finding open |
| Fuel price crowd-source review authorization | dashboard/gasprices | Controller (reviewFuelPriceSuggestion) | test coverage | LOW — VENOM finding LOW |
| Flyer public details write authorization | dashboard/flyerBuilder | Controller only (no DAL backstop) | MISSING | HIGH — VEN-DASHBOARD-001 OPEN |
| VPORT settings write authorization | dashboard/settings | Controller + actor_owners check | MISSING | HIGH — VEN-DASHBOARD-002 OPEN |
| Card sub-module write authorization (×11 cards) | UNVERIFIED (8 cards) | UNKNOWN for 8 of 11 cards | MISSING | HIGH — VEN-SHELL-002 THOR BLOCKER |

---

## Runtime Ownership Map

RUNTIME OWNERSHIP MAP (INFERRED — LOKI not run)

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Dashboard shell entry | `/actor/:actorId/dashboard` → VportDashboardScreen | dashboard (shell) | checkVportOwnership | getActorByIdDAL (via adapter) | Ownership check on every mount + focus |
| Booking state update | VportDashboardBookingHistoryScreen | dashboard/bookings | updateVportBooking | updateVportBookingDAL | Terminal state guard; notification dispatch |
| Gas price submission | VportDashboardGasScreen | dashboard/gasprices | submitFuelPriceSuggestion, reviewFuelPriceSuggestion | createFuelPriceSubmissionDAL, etc. | Crowd-source review and apply path |
| Design Studio canvas | VportDesignStudioViewScreen | dashboard/flyerBuilder | flyerEditor, designStudio controllers | designStudio.write.dal.js | Multi-table write on save/export |
| Team member CRUD | VportDashboardTeamScreen | dashboard/team | team controllers | vportTeam.write.dal.js | resources table; linked actor insertion |
| VPORT settings save | VportSettingsScreen | dashboard/settings | settingsCoordinator | upsertVportPublicDetailsDAL | Public profile update |

---

## Engine Ownership Review

ENGINE OWNERSHIP REVIEW

| Engine | Owner | Consumers | Public Interfaces | Boundary Risk |
|---|---|---|---|---|
| engines/availability | engines/availability | dashboard/calendar, dashboard/schedule | availability rules read API | LOW — read-only from dashboard |
| engines/booking | engines/booking | dashboard (assertActorOwnsVportActorController, getActorByIdDAL via adapter) | booking.adapter | MEDIUM — ownership check exported from booking domain |
| engines/identity | engines/identity | dashboard (actor resolution, actor_owners) | identity context, actor lookup | LOW — consumed via adapter |
| engines/media | engines/media | dashboard/flyerBuilder, dashboard/portfolio | media.adapter | LOW — asset creation via adapter |
| engines/notification | engines/notification | dashboard/bookings (updateVportBooking notification) | notifications.adapter | LOW — publish via adapter |
| engines/profile | engines/profile | dashboard (shell — useVportDashboardDetails, useProfilesOps) | profiles.adapter | LOW — read-only public profile |
| engines/portfolio | engines/portfolio | dashboard/portfolio | portfolio card DAL | LOW |
| engines/review | engines/review | dashboard/reviews | reviews DAL | LOW |
| engines/qr | engines/qr | dashboard/qrcode | qrcode.adapter | LOW |
| engines/menu | engines/menu | dashboard/flyer | menu flyer DAL | LOW |
| engines/lead | engines/lead | dashboard/leads | lead DAL | LOW |
| engines/hydration | engines/hydration | dashboard (identity hydration) | identity context | LOW |

---

## Native Parity Ownership

Not applicable — dashboard is React web PWA only. No native parity surfaces identified.

---

## Governance Integration

### THOR Release Gate

THOR blockers from this IRONMAN run:
- OWN-DSH-001 (HIGH) — No declared feature owner → THOR cannot gate release
- OWN-DSH-002 (HIGH) — Actor ownership rule has no declared authority → existing VENOM blocker VEN-SHELL-002 reinforced
- OWN-DSH-004 (MEDIUM) — vport.profile_public_details split write path — CAUTION (not BLOCK unless VEN-DASHBOARD-001/002 open)
- OWN-DSH-005 (MEDIUM) — Feature-level BEHAVIOR.md is a stub → CAUTION

THOR may allow CAUTION on OWN-DSH-003, OWN-DSH-005, OWN-DSH-006, OWN-DSH-007.
THOR must BLOCK on OWN-DSH-001 (no feature owner declared) and reinforce existing VEN-SHELL-002 BLOCK.

### LOGAN Integration

LOGAN required actions:
- Write feature-level BEHAVIOR.md (OWN-DSH-005 — P1)
- Remove or reconcile duplicate model files in screens/model/ (OWN-DSH-007 — LOW)

### SENTRY Integration

SENTRY required actions:
- Verify card sub-module ownership enforcement for 8 unverified cards (OWN-DSH-002 reinforcement)
- Verify getActorByIdDAL adapter boundary compliance (OWN-DSH-003)

### WOLVERINE Integration

WOLVERINE required actions:
- Create migration ticket for getActorByIdDAL move to @/shared/dal/actor/ (OWN-DSH-003)

---

## Summary Counts

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 3 |
| LOW | 2 |

Total findings: 7

Ownership Clarity Overall: PARTIAL
Primary gap: No declared engineering owner for a 258-file feature with 37 write surfaces.

---

## Write 2 Confirmation

| File | Action | Status |
|---|---|---|
| ZZnotforproduction/APPS/VCSM/features/dashboard/OWNERSHIP.md | CREATED (new file — was MISSING) | COMPLETE |
| ZZnotforproduction/APPS/VCSM/features/dashboard/CURRENT_STATUS.md → ## IRONMAN section | APPENDED | COMPLETE |
