---
name: vcsm.booking.architecture
description: ARCHITECT V2 module architecture report for VCSM:booking
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** booking
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/booking
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The booking module manages the full lifecycle of service appointments on the VCSM platform: creating bookings (public citizen and management flows), confirming, cancelling, and querying bookings, as well as managing availability rules, exceptions, and booking resources (staff/location slots). It is the platform's core scheduling engine, wiring together actor ownership verification, availability computation, service-profile durations, and cross-cutting notification delivery. The feature exposes its public surface through a typed adapter and delegates availability computation and notification dispatch to their respective engines.

## OWNERSHIP

Booking domain feature team. Consumed by: dashboard (vport booking management), profiles (public booking CTA), notifications (booking event types), join (QR booking accept path), and settings (availability management). Primary responsibility: booking state machine, ownership gates, resource/slot management, and service-profile data.

## ENTRY POINTS

- Public booking creation: `createBookingController` (invoked from profile/public booking flows via the booking engine or direct import)
- Management booking creation: `createBookingController` with source `owner | admin | import | sync` (dashboard-sourced)
- Cancel booking: `cancelBookingController` (customer or owner)
- Confirm booking: `confirmBookingController` (owner-only)
- Manage availability: `setAvailabilityRuleController`, `setAvailabilityExceptionController`
- List bookings: `listMyBookingsController` (customer), dashboard read via engine
- Resource management: `ensureOwnerBookingResourceController`, `listOwnerBookingResourcesController`
- Engine startup: `setupVcsmBookingEngine()` in `setup.js` — called at app startup in `main.jsx`
- Adapter surface: `apps/VCSM/src/features/booking/adapters/booking.adapter.js`

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 33 | insertBooking.dal.js, updateBookingStatus.dal.js, upsertAvailabilityRule.dal.js, saveBookingServiceProfileDurationsByServiceIds.dal.js, listBookingsByCustomer.dal.js |
| Model | 41 | booking.model.js, bookingAvailability.model.js, buildSlots.model.js, buildBookingPayload.model.js, bookingCalendar.model.js |
| Controller | 19 | createBooking.controller.js, cancelBooking.controller.js, confirmBooking.controller.js, assertActorOwnsVportActor.controller.js, setAvailabilityRule.controller.js |
| Service | N/A | — |
| Adapter | 1 | booking.adapter.js |
| Hook | 17 | useCreateBooking.js, useBookingOps.js, useBookingAvailability.js, useManageAvailability.js, useOwnerBookingResources.js |
| Component | 0 | components/.gitkeep — no components present |
| Screen | 0 | screens/.gitkeep — no screens present |
| Barrel | 28 | Resolved via callgraph traversal across engine barrel re-exports |

Counts sourced from cg_layerCounts (callgraph). fm_layerCounts (feature-map): controller 15, dal 22, hook 16, model 11, adapter 1.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source readable, BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md contains no behavioral spec — governance gap |
| Owner defined | FAIL | No ownership record in docs | No OWNERSHIP.md or owner field in governance docs |
| Entry points mapped | PASS | Adapter exports 13 hooks + 2 approved DAL/controller exceptions | No route in route-map — booking is entered via feature imports, not routes |
| Controllers present/delegated | PASS | 15 fm / 19 cg controllers | Full lifecycle covered: create, cancel, confirm, assert ownership, availability, resources |
| DAL/repository present/delegated | PASS | 22 fm / 33 cg DAL files | 8 write surfaces confirmed by scanner; broad read surface covers all major entities |
| Models/transformers present | PASS | 11 fm / 41 cg model files | mapBookingRow, slot builders, calendar models, availability models all present |
| Hooks/view models present | PASS | 16 fm / 17 cg hooks | All major booking operations have corresponding hooks |
| Screens/components present | FAIL | screens/.gitkeep, components/.gitkeep | No screens or components in this feature — UI lives entirely in dashboard/profiles consumers |
| Services/adapters present | PASS | 1 adapter (booking.adapter.js) | Adapter exports approved cross-feature surface correctly |
| Database objects mapped | PASS | 8 write surfaces: bookings, resources, availability_rules, availability_exceptions, service_booking_profiles, resource_services | insertBookingDAL uses `vportClient` — confirm schema routing |
| Authorization path mapped | PASS | assertActorOwnsVportActorController fully hardened (ELEK-004) | DB query via actor_owners is correct; kind check precedes self-shortcut |
| Cache/runtime behavior mapped | FAIL | No cache layer observed in source | No React Query / SWR / memo patterns found; stale-data risk for availability queries |
| Error/loading/empty states mapped | PARTIAL | Hooks expose isPending + error (useCreateBooking) | Empty state handling left to consuming features; no standard empty pattern in this module |
| Documentation linked | FAIL | BEHAVIOR.md present but is PLACEHOLDER | Behavior contract contains no spec — no happy paths, data flow, or status machine documented |
| Tests/validation noted | PARTIAL | 1 test file: assertActorOwnsVportActor.controller.test.js (17 assertions) | Only ownership gate tested; no tests for createBooking, cancelBooking, availability controllers |
| Native parity noted | N/A | Feature is web-only | — |
| Engine dependencies mapped | PASS | Engines: availability, booking, hydration, notification, profile, qr | setup.js wires booking engine with supabase/vport clients and notifyFn |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/availability | Engine | Inbound (booking feature configures it) | YES | setup.js calls configureBookingEngine |
| engines/booking | Engine | Bidirectional | YES | @booking alias — hooks and adapter import from engine barrel |
| engines/notification | Engine | Outbound (fire-and-forget) | YES | publishVcsmNotification imported from notifications.adapter |
| engines/profile | Engine | Inbound (profile resolution) | YES | profile engine consumed via controller resolution |
| engines/qr | Engine | Outbound | YES | useQrLinks.js wraps qr engine |
| engines/hydration | Engine | Inbound | YES | hydration engine wires identity context |
| features/notifications | Cross-feature | Outbound via adapter | APPROVED | publishVcsmNotification via notifications.adapter — adapter boundary respected |
| vc.actors | DB table | Read | YES | getActorByIdDAL reads actor kind/void/profile_id |
| actor_owners | DB table | Read | YES | readActorOwnerLinkByActorAndUserProfile.dal.js — ownership verification |
| bookings | DB table | Write (insert, update) | YES | insertBookingDAL, updateBookingStatusDAL |
| resources | DB table | Write (insert) | YES | insertBookingResourceDAL |
| availability_rules | DB table | Write (upsert) | YES | upsertAvailabilityRuleDAL |
| availability_exceptions | DB table | Write (upsert) | YES | upsertAvailabilityExceptionDAL |
| vc.service_booking_profiles | DB table | Write (insert, update) | YES | saveBookingServiceProfileDurationsByServiceIds.dal.js |
| vc.resource_services | DB table | Write (upsert) | YES | upsertBookingResourceServicesDAL |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| bookings (insert) | Write — insertBookingDAL | booking feature | createBookingController | No status machine RPC — raw INSERT with manual status field (TICKET-BOOKING-RPC-001) |
| bookings (update status) | Write — updateBookingStatusDAL | booking feature | cancelBooking, confirmBooking controllers | Status field is set by controller, not enforced by DB state machine |
| resources (insert) | Write — insertBookingResourceDAL | booking feature | ensureOwnerBookingResource controller | resource_id is returned and used for slot scoping |
| availability_rules (upsert) | Write — upsertAvailabilityRuleDAL | booking feature | setAvailabilityRule controller | Owner gate required upstream |
| availability_exceptions (upsert) | Write — upsertAvailabilityExceptionDAL | booking feature | setAvailabilityException controller | Owner gate required upstream |
| vc.service_booking_profiles (insert+update) | Write | booking feature | saveBookingServiceProfileDurations | Profile-level duration overrides per service |
| vc.resource_services (upsert) | Write | booking feature | upsertBookingResourceServices | Ties services to resources |
| vc.actors (read) | Read — getActorByIdDAL | identity engine | assertActorOwnsVportActor, createBooking | Exposed via adapter §5.3 exception (1 approved external call site) |
| actor_owners (read) | Read — readActorOwnerLinkByActorAndUserProfile | booking feature | assertActorOwnsVportActor | Core ownership assertion — hardened per ELEK-004 |
| bookings (read) | Read — getBookingById, listBookingsByCustomer, listBookingsByResource, listBookingsInRange | booking feature | cancel, confirm, list controllers | Read-heavy; no explicit cache layer |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | WARN | No routes in route-map; no screens in source | Feature is consumed entirely via engine and adapter imports — no standalone route |
| Loading state | PARTIAL | useCreateBooking exposes isPending | Other hooks (useBookingAvailability, useManageAvailability) need audit for loading state exposure |
| Empty state | PARTIAL | No empty-state handling in feature boundary | Empty state managed by consuming features (dashboard, profiles) — no standard |
| Error state | PARTIAL | useCreateBooking returns { ok, error } | Controller errors bubble to hook callers; no centralized error boundary in this module |
| Auth/owner gates | PASS | assertActorOwnsVportActorController hardened (ELEK-004) | Kind check precedes self-shortcut; actor_owners DB verification required for cross-actor ops |
| Cache behavior | FAIL | No cache observed in booking feature | Real-time availability queries may return stale slot data between requests |
| Runtime dependencies | PASS | setup.js registers engine with supabase+vport clients and notifyFn | Must be called before first booking operation; bootstrapped in main.jsx |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/booking/BEHAVIOR.md | PRESENT — PLACEHOLDER only |
| Ownership record | — | MISSING |
| Security audit | ELEK-004 resolved in assertActorOwnsVportActor.controller.js | PARTIAL (ELEK-004 patched; TICKET-BOOKING-RPC-001 open) |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | TICKET-BOOKING-RPC-001 references migration 20260523020000 | OPEN — not resolved |
| Native transfer audit | N/A | N/A |
| Engine audit | setup.js wires booking engine | PARTIAL — engine wiring present; no audit doc |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is PLACEHOLDER | HIGH | No behavioral spec exists — happy paths, error paths, status machine, and data flow are undocumented | LOGAN |
| No screens or components in feature | MEDIUM | UI entirely lives in consumer features (dashboard, profiles) — no owned UI surface makes regression scoping difficult | IRONMAN |
| TICKET-BOOKING-RPC-001 open | HIGH | Raw INSERT/UPDATE on bookings table bypasses DB state machine — customer_actor_id injection + status overpermission confirmed on live DB | CARNAGE / VENOM |
| No tests for create/cancel/confirm controllers | HIGH | Core booking lifecycle (createBooking, cancelBooking, confirmBooking) has zero test coverage | SPIDER-MAN |
| No cache layer for availability queries | MEDIUM | Stale slot data returned between requests — double-booking risk under concurrent load | KRAVEN / LOKI |
| No CURRENT_STATUS.md (pre this run) | LOW | Governance gap — no persistent status record | ARCHITECT |
| No ARCHITECTURE.md (pre this run) | LOW | Architecture not captured in governance docs | ARCHITECT |

---

## MODULE BOUNDARY WARNINGS

The adapter (booking.adapter.js) contains two approved §5.3 exceptions:

1. `assertActorOwnsVportActorController` is exported directly from the adapter (not a hook or component). This is an approved cross-feature controller export with 9 declared call sites in dashboard controllers. Risk: if dashboard controllers call this controller directly without the adapter boundary, a layer violation exists. Static scan cannot confirm all 9 call sites use the adapter path.

2. `getActorByIdDAL` is exported from the adapter — a DAL function exposed at adapter boundary. This is an approved exception (1 declared call site: dashboard controller self-ownership check). DAL exports from adapters are architecture exceptions and should be reviewed for consolidation into a controller or engine.

`cancelBooking.controller.js` imports directly from `@/features/notifications/adapters/notifications.adapter` — this is a cross-feature import via adapter, which is correct per the architecture contract.

No other boundary violations detected in static scan.

---

## SPAGHETTI SCORE

**Module:** booking
**Score:** WATCH
**Reasons:** Core booking lifecycle controllers are clean and well-layered (DAL → Model → Controller → Hook). Two adapter-boundary exceptions (DAL + controller exports) represent architectural debt. Open TICKET-BOOKING-RPC-001 (raw INSERT/UPDATE without state machine) is a correctness risk that borders on architectural debt. No screens or components means the module boundary is narrow — UI coupling is fully deferred to consumers.
**Release risk:** MEDIUM — TICKET-BOOKING-RPC-001 open; no test coverage on create/cancel/confirm controllers.

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavioral spec content

**Check A (Source without behavior):** FAIL — BEHAVIOR.md is a placeholder; source exists and is substantial (66 files) but no behavior contract documents its intent.
**Check B (Behavior without source):** N/A — BEHAVIOR.md declares no happy paths to compare against source.
**Check C (§13 engine consistency):** PARTIAL — scanner declares engines: availability, booking, hydration, notification, profile, qr. Source confirms: @booking alias used in hooks, publishVcsmNotification from notification engine, setup.js wires availability+booking engine. hydration and profile engines are consumed indirectly via controllers/DAL. qr engine confirmed via useQrLinks.js. All 6 declared engines have evidence in source.
**Check D (§6 data change consistency):** PASS — scanner write surfaces (bookings insert/update, resources insert, availability_rules upsert, availability_exceptions upsert, service_booking_profiles insert/update, resource_services upsert) all confirmed in DAL source files read.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P0 | Write BEHAVIOR.md spec | Booking is a core transactional feature with zero documented behavioral contract | LOGAN |
| P1 | Resolve TICKET-BOOKING-RPC-001 | Raw bookings INSERT/UPDATE bypasses DB state machine — security and correctness risk on live DB | CARNAGE + VENOM |
| P2 | Add controller test coverage (createBooking, cancelBooking, confirmBooking) | Core lifecycle has 1 test file covering only ownership gate | SPIDER-MAN |
| P3 | Audit cache/availability staleness | Concurrent booking requests may produce double-bookings without slot locking or cache invalidation | KRAVEN + LOKI |

## RECOMMENDED HANDOFFS

- **LOGAN** — BEHAVIOR.md stub must be replaced with a full behavioral spec before next release
- **CARNAGE** — TICKET-BOOKING-RPC-001: migrate booking insert/update to typed state-machine RPCs
- **VENOM** — Security review of raw bookings table mutations and status overpermission path
- **SPIDER-MAN** — Add regression coverage for createBooking, cancelBooking, confirmBooking controllers
- **LOKI** — Runtime observability: trace availability query latency and slot conflict detection
- **KRAVEN** — Performance: availability query range and concurrent slot contention analysis

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
