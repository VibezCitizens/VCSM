---
name: vcsm.booking.behavior
description: Feature-level behavior contract for the VCSM booking feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P0
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — booking
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The booking feature manages the full lifecycle of service appointments on the VCSM platform. It handles creating bookings (from both public citizen and management flows), confirming and cancelling bookings, managing availability rules and exceptions, and managing booking resources (staff members and location slots). It is the platform's core scheduling engine.

The feature wires together actor ownership verification, availability computation, service-profile durations, and cross-cutting notification delivery. It exposes its public surface through a typed adapter (`booking.adapter.js`) and delegates availability computation and notification dispatch to their respective engines.

**Owner:** Booking domain feature team. Consumed by: dashboard (vport booking management), profiles (public booking CTA), notifications (booking event types), join (QR booking accept path), and settings (availability management).

**Sources:**
- ARCHITECTURE.md — PURPOSE section
- ARCHITECTURE.md — OWNERSHIP section
- CURRENT_STATUS.md

---

## §2 Entry Points

| Entry Point | Description | Source |
|---|---|---|
| `createBookingController` (customer source) | Public booking creation from profile/public booking flows | ARCHITECTURE.md — ENTRY POINTS |
| `createBookingController` (management source: owner, admin, import, sync) | Management booking creation from dashboard | ARCHITECTURE.md — ENTRY POINTS |
| `cancelBookingController` | Cancel a booking — customer or owner initiated | ARCHITECTURE.md — ENTRY POINTS |
| `confirmBookingController` | Confirm a pending booking — owner-only | ARCHITECTURE.md — ENTRY POINTS |
| `setAvailabilityRuleController` | Owner sets recurring availability rules | ARCHITECTURE.md — ENTRY POINTS |
| `setAvailabilityExceptionController` | Owner sets a one-off availability exception | ARCHITECTURE.md — ENTRY POINTS |
| `listMyBookingsController` | Customer lists their own bookings | ARCHITECTURE.md — ENTRY POINTS |
| `ensureOwnerBookingResourceController` | Owner creates a staff/location booking resource | ARCHITECTURE.md — ENTRY POINTS |
| `listOwnerBookingResourcesController` | Owner lists their bookable resources | ARCHITECTURE.md — ENTRY POINTS |
| `setupVcsmBookingEngine()` in `setup.js` | Engine startup — called at app startup in `main.jsx` | ARCHITECTURE.md — ENTRY POINTS |
| `booking.adapter.js` | Adapter surface — exports 13 hooks + 2 approved exceptions | ARCHITECTURE.md — ENTRY POINTS; INDEX.md |

**No routes in route-map.** The booking feature is consumed entirely as a library via the `@booking` engine alias and the `booking.adapter.js` adapter. Entry points are invoked by dashboard, profiles, and join features — not via standalone routes.

**Source:** ARCHITECTURE.md — ENTRY POINTS; INDEX.md — Routes section

---

## §3 User Flows

### 3.1 Customer Booking Flow
1. Customer selects a VPORT, a service, and a date/time from the booking UI (lives in the profiles consumer feature — not in this module).
2. `useCreateBooking` hook is invoked with booking parameters.
3. `createBookingController` is called with source = `customer`.
4. `customerActorId` is accepted from caller (SECURITY GAP — no session binding verification — see §6, §9).
5. `status` is accepted from caller (SECURITY GAP — no allowlist enforced — see §6, §9).
6. `insertBookingDAL` writes the booking record as a raw INSERT (no state-machine RPC — TICKET-BOOKING-RPC-001 open).
7. Notification is dispatched with a linkPath. Raw UUID exposure in `createBookingController` line 138 notification linkPath is OPEN (cancel/confirm paths were patched; create was not — VEN-BOOKING-009).

**Source:** modules/create/BEHAVIOR.md; SECURITY.md (VEN-BOOKING-004, VEN-BOOKING-007, VEN-BOOKING-009)

### 3.2 Owner/Management Booking Flow
1. Owner creates a booking on behalf of a customer from the dashboard.
2. `createBookingController` is called with source = `owner | admin | import | sync`.
3. Ownership check is performed via `assertActorOwnsVportActorController`.
4. `customerActorId` is accepted from caller (same injection risk as customer path — VEN-BOOKING-007).
5. `status` is accepted from caller with no allowlist (same risk as customer path — VEN-BOOKING-004).
6. `insertBookingDAL` writes the booking record.

**Source:** modules/create/BEHAVIOR.md; SECURITY.md (VEN-BOOKING-004, VEN-BOOKING-007)

### 3.3 Cancel Booking Flow
1. Owner or customer initiates a cancel via `useBookingOps`.
2. `cancelBookingController` verifies ownership.
3. `updateBookingStatusDAL` executes UPDATE on the bookings table.
4. Cancellation notification is sent; linkPath uses slug (VEN-BOOKING-005 FIXED).
5. SECURITY GAP: No terminal-state guard — cancelled bookings can be re-cancelled, mutating `cancelled_at` and `internalNote` (BW-BOOK-013, ELEK-2026-06-04-009).

**Source:** modules/ops/BEHAVIOR.md; SECURITY.md

### 3.4 Confirm Booking Flow
1. Owner confirms a pending booking via `useBookingOps`.
2. `confirmBookingController` verifies ownership.
3. `updateBookingStatusDAL` sets status to confirmed.
4. SECURITY GAP: No terminal-state gate — cancelled or completed bookings can be re-confirmed (BW-BOOK-012, ELEK-2026-06-04-003).

**Source:** modules/ops/BEHAVIOR.md; SECURITY.md

### 3.5 Set Availability Rule Flow
1. Owner sets recurring availability (hours, days) via `useManageAvailability`.
2. `setAvailabilityRuleController` verifies ownership via `assertActorOwnsVportActorController`.
3. `upsertAvailabilityRuleDAL` writes the rule with `onConflict: id`.
4. SECURITY GAP: `onConflict: id` does not scope to `resource_id` — cross-actor rule hijack is possible (BW-BOOK-009, ELEK-2026-06-04-001).

**Source:** modules/availability/BEHAVIOR.md; SECURITY.md

### 3.6 Set Availability Exception Flow
1. Owner sets a one-off exception (closed day, holiday) via `useManageAvailability`.
2. `setAvailabilityExceptionController` verifies resource ownership.
3. `upsertAvailabilityExceptionDAL` writes with `onConflict: id`.
4. SECURITY GAP: Same cross-actor hijack vector as availability rules (BW-BOOK-010, ELEK-2026-06-04-002).

**Source:** modules/availability/BEHAVIOR.md; SECURITY.md

### 3.7 Read Availability / Slot Computation Flow
1. Customer or owner reads available slots for a resource via `useBookingAvailability`.
2. `getResourceAvailabilityController` reads rules and exceptions.
3. `buildSlots.model` computes available time slots from rules and exceptions.
4. No write surfaces in slot computation.
5. No cache layer observed — stale slot data may be returned between requests (double-booking risk).

**Source:** modules/availability/BEHAVIOR.md; ARCHITECTURE.md — MODULE RUNTIME READINESS

### 3.8 Resource Management Flow
1. Owner adds a staff member or location as a bookable resource via `useAddStaffResource` / `useLocationResources`.
2. `ensureOwnerBookingResourceController` verifies ownership.
3. `insertBookingResourceDAL` creates the resource.
4. Owner views resources via `useOwnerBookingResources` → `listOwnerBookingResourcesController`.
5. SECURITY GAP: `listOwnerBookingResourcesController` has no caller auth assertion — any actor can enumerate foreign resources (BW-BOOK-007, ELEK-2026-06-04-010).

**Source:** modules/resources/BEHAVIOR.md; SECURITY.md

### 3.9 Slot Duration and Service-Resource Link Configuration (SILENTLY BROKEN)
1. Owner configures slot duration for a service on a resource.
2. `setResourceSlotDurationController` calls `saveBookingServiceProfileDurationsByServiceIdsDAL`.
3. **DAL IS DEAD**: undefined `supabase` variable at lines 38, 53, 79 — all writes silently fail. Users see success UI but no data is saved (VEN-BOOKING-002, ELEK-2026-06-04-006).
4. Owner links services to a resource via resource management flow.
5. `upsertBookingResourceServicesDAL` is called.
6. **DAL IS DEAD**: undefined `supabase` variable at line 24 — all writes silently fail (VEN-BOOKING-003, ELEK-2026-06-04-007).

**Source:** modules/resources/BEHAVIOR.md; SECURITY.md

### 3.10 Service and Service Profile Load Flow
1. Booking UI loads available services for a VPORT via `useBookingServices`.
2. `bookingServicesController` → `readVportServicesByActorDAL` → returns services for actor.
3. Booking flow reads service duration profiles via `useBookingServiceProfiles`.
4. `getBookingServiceProfilesController` → `listBookingServiceProfilesByServiceIdsDAL`.
5. Profiles drive slot duration computation in the availability module.
6. Per-resource service duration overrides: `useResourceServiceOverrides` → `listBookingResourceServicesByResourceIdDAL`.

**Source:** modules/services/BEHAVIOR.md

---

## §4 Business Rules

| Rule | Evidence Source |
|---|---|
| All management-source booking operations require prior ownership verification via `assertActorOwnsVportActorController` | ARCHITECTURE.md — OWNERSHIP; modules/ownership/BEHAVIOR.md |
| Booking creation for management sources (owner, admin, import, sync) requires caller to be verified owner of the target VPORT actor | modules/create/BEHAVIOR.md; ARCHITECTURE.md |
| `confirmBooking` is owner-only — customers cannot confirm a booking | ARCHITECTURE.md — ENTRY POINTS |
| Notifications after cancel or confirm use slug-based linkPaths (not raw UUIDs) — VEN-BOOKING-005 CLOSED | SECURITY.md (VEN-BOOKING-005 CLOSED) |
| Slot duration profiles drive availability computation — service profile overrides per resource are supported | modules/services/BEHAVIOR.md |
| Engine must be initialized via `setupVcsmBookingEngine()` before any booking operation — bootstrapped in `main.jsx` | ARCHITECTURE.md — ENTRY POINTS; MODULE RUNTIME READINESS |
| Availability rules and exceptions are scoped to a booking resource (staff/location slot) | modules/availability/BEHAVIOR.md |
| QR booking links must use VPORT slug — not raw actorId | modules/ownership/BEHAVIOR.md |
| Notification linkPaths in cancel/confirm flows must use slug — not raw UUID | SECURITY.md (VEN-BOOKING-005 CLOSED); modules/ops/BEHAVIOR.md |
| `insertBookingDAL` uses `vportClient` — schema routing must be confirmed | ARCHITECTURE.md — MODULE COMPLETENESS MATRIX |

**Unresolved business rule gap:** No documented allowlist of valid booking statuses on INSERT. The rule "INSERT status must be `pending` only" is stated as a critical invariant that is CURRENTLY VIOLATED, not as an enforced policy.

**Source:** modules/create/BEHAVIOR.md — Critical Invariants

---

## §5 State Rules

**State machine documentation status:** No formal state machine is documented in governance artifacts. TICKET-BOOKING-RPC-001 is open specifically because no typed DB state-machine RPC exists. All state transitions are performed via raw INSERT/UPDATE. The following transitions are implied by governance artifacts:

| Transition | Trigger | Controller | Notes |
|---|---|---|---|
| (none) → pending | Booking creation | `createBookingController` | `status` field accepted from caller with no enforcement — INVARIANT VIOLATED |
| pending → confirmed | Owner confirms | `confirmBookingController` | No terminal-state gate — cancelled/completed can also be re-confirmed — INVARIANT VIOLATED |
| (any) → cancelled | Owner or customer cancels | `cancelBookingController` | No terminal-state guard — re-cancel is possible — INVARIANT VIOLATED |
| (any status) → (any status) | Arbitrary status set on INSERT | `createBookingController` | Caller can set any status including terminal values — INVARIANT VIOLATED |

**Status field values:** UNKNOWN — no formal list of valid booking statuses is documented in governance artifacts.

**Terminal state definition:** UNKNOWN — governance artifacts reference "terminal-state gate" as missing (BW-BOOK-012, BW-BOOK-013) but do not define which statuses are terminal.

**Source:** modules/ops/BEHAVIOR.md — Critical Invariants; modules/create/BEHAVIOR.md — Critical Invariants; SECURITY.md (BW-BOOK-012, BW-BOOK-013, ELEK-2026-06-04-003, ELEK-2026-06-04-009); ARCHITECTURE.md — MODULE DATA CONTRACT

---

## §6 Security Constraints

Each constraint is derived from an open VENOM, BlackWidow, or ELEKTRA finding. All constraints below describe the intended correct behavior (the finding describes the current violation).

| Constraint | Evidence |
|---|---|
| CONSTRAINT: `updateBookingStatusDAL` must filter by `owner_actor_id` in addition to `bookingId` — RLS alone must not be the sole persistence-layer barrier | VEN-BOOKING-001 / ELEK-2026-06-04-005 — OPEN CRITICAL |
| CONSTRAINT: `saveBookingServiceProfileDurationsByServiceIdsDAL` must use a defined `supabase` client — DAL must not silently fail all writes | VEN-BOOKING-002 / ELEK-2026-06-04-006 — OPEN CRITICAL |
| CONSTRAINT: `upsertBookingResourceServicesDAL` must use a defined `supabase` client — DAL must not silently fail all writes | VEN-BOOKING-003 / ELEK-2026-06-04-007 — OPEN CRITICAL |
| CONSTRAINT: `createBookingController` must enforce a status allowlist on INSERT — caller must not be able to supply arbitrary status values | VEN-BOOKING-004 / ELEK-2026-06-04-004 — OPEN HIGH |
| CONSTRAINT: `createBookingController` must not accept `customerActorId` from caller for any source — identity must be derived from authenticated session | VEN-BOOKING-007 / ELEK-2026-06-04-008 / BW-BOOK-003 — OPEN HIGH |
| CONSTRAINT: notification `linkPath` in `createBookingController` must use VPORT slug — not raw owner actorId UUID | VEN-BOOKING-009 / ELEK-2026-06-04-011 / BW-BOOK-015 — OPEN MEDIUM |
| CONSTRAINT: `listBookingsByCustomerDAL` must not return `profile_id` — internal DB identifier must not be surfaced in the booking model | VEN-BOOKING-010 / ELEK-2026-06-04-012 — OPEN MEDIUM |
| CONSTRAINT: `upsertAvailabilityRuleDAL` conflict resolution must be scoped to `(resource_id, id)` — not `id` alone — to prevent cross-actor rule hijack | BW-BOOK-009 / ELEK-2026-06-04-001 — OPEN HIGH |
| CONSTRAINT: `upsertAvailabilityExceptionDAL` conflict resolution must be scoped to `(resource_id, id)` — not `id` alone — to prevent cross-actor exception hijack | BW-BOOK-010 / ELEK-2026-06-04-002 — OPEN HIGH |
| CONSTRAINT: `confirmBookingController` must check current booking status before confirming — terminal-state bookings must not be re-confirmed | BW-BOOK-012 / ELEK-2026-06-04-003 — OPEN HIGH |
| CONSTRAINT: `cancelBookingController` must check current booking status before cancelling — already-cancelled bookings must be a no-op | BW-BOOK-013 / ELEK-2026-06-04-009 — OPEN MEDIUM |
| CONSTRAINT: `listOwnerBookingResourcesController` must assert caller identity and authorization — any actor must not be able to enumerate foreign booking resources | BW-BOOK-007 / ELEK-2026-06-04-010 — OPEN MEDIUM |
| CONSTRAINT: `createBookingController` must bind `requestActorId` to authenticated session — direct API consumer must not attribute a booking to an arbitrary citizen | BW-BOOK-003 — OPEN HIGH |
| CONSTRAINT: All booking INSERTs and status UPDATEs must go through typed state-machine RPCs — raw table mutations are not permitted | TICKET-BOOKING-RPC-001; ARCHITECTURE.md — MODULE DATA CONTRACT |

**Fixed constraint (closed finding):**
| CONSTRAINT (ENFORCED): notification `linkPath` in `cancelBookingController` and `confirmBookingController` uses VPORT slug — not raw UUID | VEN-BOOKING-005 — CLOSED |

**Source:** SECURITY.md; modules/*/BEHAVIOR.md

---

## §7 Error Handling

**Documented error patterns:**

| Error Path | Behavior | Source |
|---|---|---|
| `assertActorOwnsVportActorController` — null `requestActorId` | Rejected at controller gate | modules/ownership/BEHAVIOR.md (BW-BOOK-004 CLOSED) |
| `assertActorOwnsVportActorController` — wrong actor kind | Rejected; kind check precedes self-shortcut | modules/ownership/BEHAVIOR.md (BW-BOOK-006 CLOSED) |
| `assertActorOwnsVportActorController` — stale/voided session | Rejected via live DB lookup in `actor_owners` | modules/ownership/BEHAVIOR.md (BW-BOOK-005 CLOSED) |
| `assertActorOwnsVportActorController` — non-owner actor | Throws — not owner | modules/ownership/BEHAVIOR.md |
| Null `viewerActorId` at controller gates | Rejected | SECURITY.md (BW-BOOK-011 CLOSED) |
| `useCreateBooking` hook error | Returns `{ ok, error }` to caller | ARCHITECTURE.md — MODULE RUNTIME READINESS |
| Resource-missing path in `cancelBookingController` | Throws correctly; residual concern is orphaned bookings in DB | SECURITY.md (VEN-BOOKING-008 LOW OPEN) |
| Owner-source booking gate — non-owner on `isOwner` prop | Controller enforces ownership regardless of client-side prop | SECURITY.md (BW-BOOK-008 CLOSED) |

**UNKNOWN — not documented in governance artifacts:**
- Error handling for slot computation failures (buildSlots.model)
- Error handling for dead DAL write paths (slot duration, resource-service link) — users see success UI but no data is saved
- Error handling for availability query failures (useBookingAvailability)
- Standard empty-state handling — managed by consuming features (dashboard, profiles), not by this module

**Source:** modules/ownership/BEHAVIOR.md; SECURITY.md; ARCHITECTURE.md — MODULE RUNTIME READINESS

---

## §8 Cross-Feature Dependencies

| Dependency | Type | Direction | Approved | Notes |
|---|---|---|---|---|
| engines/availability | Engine | Inbound (booking feature configures it) | YES | `setup.js` calls `configureBookingEngine` |
| engines/booking | Engine | Bidirectional | YES | `@booking` alias — hooks and adapter import from engine barrel |
| engines/notification | Engine | Outbound (fire-and-forget) | YES | `publishVcsmNotification` imported from `notifications.adapter` |
| engines/profile | Engine | Inbound (profile resolution) | YES | Profile engine consumed via controller resolution |
| engines/qr | Engine | Outbound | YES | `useQrLinks.js` wraps qr engine |
| engines/hydration | Engine | Inbound | YES | Hydration engine wires identity context; confirmed read-only (no poisoning vector — BW-BOOK-014 CLOSED) |
| features/notifications | Cross-feature | Outbound via adapter | APPROVED | `publishVcsmNotification` via `notifications.adapter` — adapter boundary respected |
| features/dashboard | Consumer | Inbound | YES | Dashboard consumes `assertActorOwnsVportActorController` (9 declared call sites) and adapter surface |
| features/profiles | Consumer | Inbound | YES | Profiles host public booking UI; invoke booking entry points |
| features/join | Consumer | Inbound | YES | QR booking accept path |
| features/settings | Consumer | Inbound | YES | Availability management |

**Independence status:** MOSTLY INDEPENDENT (ARCHITECT assessment, 2026-06-04)

**Architecture boundary warnings:**
- `assertActorOwnsVportActorController` is exported from `booking.adapter.js` — an approved §5.3 exception. Static scan cannot confirm all 9 dashboard call sites use the adapter path.
- `getActorByIdDAL` is exported from `booking.adapter.js` — a DAL at adapter boundary. One approved call site (dashboard self-ownership check). This is architectural debt — should be consolidated into a controller or engine.

**Source:** ARCHITECTURE.md — MODULE DEPENDENCY GRAPH; ARCHITECTURE.md — MODULE BOUNDARY WARNINGS

---

## §9 Must Never Happen — Security Invariants

Each invariant is derived from an open finding. These are behaviors that must not occur in production.

| Invariant | Violated by |
|---|---|
| INVARIANT: A booking INSERT must never set status to a non-pending value via caller-supplied input | VEN-BOOKING-004 / ELEK-2026-06-04-004 — OPEN HIGH |
| INVARIANT: A booking must never be attributed to an actor identity supplied by the caller — `customerActorId` must never come from untrusted input | VEN-BOOKING-007 / ELEK-2026-06-04-008 / BW-BOOK-003 — OPEN HIGH/CRITICAL |
| INVARIANT: `updateBookingStatusDAL` must never execute without an `owner_actor_id` filter — relying on RLS alone is not sufficient at the DAL layer | VEN-BOOKING-001 / ELEK-2026-06-04-005 — OPEN CRITICAL |
| INVARIANT: A cancelled booking must never transition to any new state (confirmed, re-cancelled, etc.) | BW-BOOK-012 / BW-BOOK-013 / ELEK-2026-06-04-003 / ELEK-2026-06-04-009 — OPEN HIGH/MEDIUM |
| INVARIANT: A completed booking must never be re-confirmed | BW-BOOK-012 / ELEK-2026-06-04-003 — OPEN HIGH |
| INVARIANT: A foreign actor's availability rule must never be overwritten using a known ruleId — conflict resolution must always scope to `(resource_id, id)` | BW-BOOK-009 / ELEK-2026-06-04-001 — OPEN HIGH |
| INVARIANT: A foreign actor's availability exception must never be overwritten using a known exceptionId — conflict resolution must always scope to `(resource_id, id)` | BW-BOOK-010 / ELEK-2026-06-04-002 — OPEN HIGH |
| INVARIANT: Booking resources belonging to a foreign actor must never be enumerable without caller authorization | BW-BOOK-007 / ELEK-2026-06-04-010 — OPEN MEDIUM |
| INVARIANT: Internal DB identifiers (`profile_id`) must never be surfaced in public-facing booking model objects | VEN-BOOKING-010 / ELEK-2026-06-04-012 — OPEN MEDIUM |
| INVARIANT: Raw actor UUID must never appear in notification `linkPath` for any booking action | VEN-BOOKING-009 / BW-BOOK-015 / ELEK-2026-06-04-011 — OPEN MEDIUM (cancel/confirm patched; create not patched) |
| INVARIANT: All booking state transitions must go through a typed state-machine RPC — raw table INSERT/UPDATE on the bookings table is not permitted | TICKET-BOOKING-RPC-001; ARCHITECTURE.md — MODULE DATA CONTRACT |
| INVARIANT: DAL functions must never reference undefined variables — undefined `supabase` in `saveBookingServiceProfileDurationsByServiceIdsDAL` and `upsertBookingResourceServicesDAL` causes silent write failures | VEN-BOOKING-002 / VEN-BOOKING-003 / ELEK-2026-06-04-006 / ELEK-2026-06-04-007 — OPEN CRITICAL |

**Source:** SECURITY.md; modules/*/BEHAVIOR.md; ARCHITECTURE.md — MODULE DATA CONTRACT

---

## §10 Module Responsibilities

| Module | Responsibility | Behavior Status |
|---|---|---|
| **create** | Customer and management booking creation — `createBookingController`, `useCreateBooking`, `insertBookingDAL`, `useBookingContextResolver` | STUB — behaviors seeded from ARCHITECT; see modules/create/BEHAVIOR.md. 3 critical invariants documented as currently violated. |
| **ops** | Cancel, confirm, and status update operations — `cancelBookingController`, `confirmBookingController`, `updateBookingStatusDAL`, `useBookingOps`, `listMyBookingsController` | STUB — behaviors seeded from ARCHITECT; see modules/ops/BEHAVIOR.md. 3 critical invariants documented as currently violated. |
| **availability** | Availability rule and exception management, slot computation — `setAvailabilityRuleController`, `setAvailabilityExceptionController`, `upsertAvailabilityRuleDAL`, `upsertAvailabilityExceptionDAL`, `buildSlots.model`, `useManageAvailability`, `useBookingAvailability` | STUB — behaviors seeded from ARCHITECT; see modules/availability/BEHAVIOR.md. 2 critical invariants currently violated. |
| **ownership** | Actor ownership verification for all management operations — `assertActorOwnsVportActorController`, `readActorOwnerLinkByActorAndUserProfile.dal`, `resolveVportProfileIdController`, `getVportSlugByActorIdDAL`, `useQrLinks` | STUB — behaviors seeded from ARCHITECT; see modules/ownership/BEHAVIOR.md. Core gate hardened (ELEK-004). 17 test assertions confirmed. |
| **resources** | Staff/location booking resource management — `ensureOwnerBookingResourceController`, `listOwnerBookingResourcesController`, `insertBookingResourceDAL`, `useOwnerBookingResources`, `useAddStaffResource`, `useLocationResources` | STUB — behaviors seeded from ARCHITECT; see modules/resources/BEHAVIOR.md. CRITICAL: slot duration and service-resource linking DALs are completely non-functional (undefined `supabase`). 1 open auth bypass. |
| **services** | Loading bookable services and service profiles for booking flow — `useBookingServices`, `useBookingServiceProfiles`, `useResourceServiceOverrides`, `bookingServicesController`, `getBookingServiceProfilesController` | STUB — behaviors seeded from ARCHITECT; see modules/services/BEHAVIOR.md. All write paths are broken (dependent on dead DALs in resources module). |

**Screens/Components:** None. The booking feature has no owned UI surface (`screens/.gitkeep`, `components/.gitkeep`). All UI lives in the dashboard and profiles consumer features.

**Source:** ARCHITECTURE.md — LAYER MAP; ARCHITECTURE.md — MODULE COMPLETENESS MATRIX; modules/*/BEHAVIOR.md

---

## §11 Known Gaps

### UNKNOWN Sections (behavior cannot be proven from governance artifacts)

1. **§5 — Valid booking status values:** The full enumeration of valid booking status values is not documented in any governance artifact.
2. **§5 — Terminal state definition:** Which statuses count as "terminal" is referenced but not defined.
3. **§7 — Dead DAL error behavior:** What the UI shows when slot duration or service-resource link writes fail silently is not documented (governance confirms data is not saved, but UX behavior is unconfirmed).
4. **§7 — Error handling for availability and slot computation failures:** Not documented.
5. **§7 — Empty-state handling:** No standard empty-state pattern in this module — delegated to consumers.

### Missing Governance

| Missing Document | Impact |
|---|---|
| OWNERSHIP.md | No ownership record exists for this feature — FAIL per ARCHITECTURE.md completeness matrix |
| TESTS.md | No test governance document — test coverage known only from ARCHITECT scan (1 test file, 17 assertions, ownership gate only) |
| Runtime audit (LOKI) | No observability governance — availability query latency and slot conflict detection untracked |
| Performance audit (KRAVEN) | No performance governance — concurrent slot contention and double-booking risk unquantified |
| Migration audit | TICKET-BOOKING-RPC-001 references migration `20260523020000` — OPEN, unresolved |
| Engine audit doc | setup.js wiring present; no audit document |

### Open Tickets

| Ticket | Summary | Priority |
|---|---|---|
| TICKET-BOOKING-RPC-001 | Replace raw booking INSERT/UPDATE with typed state-machine RPCs; `customer_actor_id` injection + status overpermission confirmed on live DB | P0 — THOR BLOCKER |

### Placeholder Modules

All 6 module BEHAVIOR.md files are STUB status (architect-derived), not full behavioral specs. They document known violations and todos but do not constitute complete behavior contracts.

**Source:** ARCHITECTURE.md — MODULE MISSING PIECES; ARCHITECTURE.md — MODULE GOVERNANCE LINKS; INDEX.md; CURRENT_STATUS.md

---

## §12 Validation Sources

| File | Key Facts Extracted |
|---|---|
| `ZZnotforproduction/APPS/VCSM/features/booking/CURRENT_STATUS.md` | Architecture state: EVOLVING; independence: MOSTLY INDEPENDENT; completeness: MOSTLY COMPLETE; spaghetti: WATCH; top gap: BEHAVIOR.md placeholder + TICKET-BOOKING-RPC-001 open |
| `ZZnotforproduction/APPS/VCSM/features/booking/SECURITY.md` | THOR Release Blocker: YES — 13 finding IDs; 3 CRITICAL, 3 HIGH, 2 MEDIUM VENOM; 8 HIGH, 4 MEDIUM ELEKTRA; 4 HIGH, 3 MEDIUM BW; VEN-BOOKING-005 CLOSED |
| `ZZnotforproduction/APPS/VCSM/features/booking/ARCHITECTURE.md` | Full module architecture: PURPOSE, OWNERSHIP, ENTRY POINTS, LAYER MAP (66 source files), MODULE COMPLETENESS MATRIX, DEPENDENCY GRAPH, DATA CONTRACT, RUNTIME READINESS, GOVERNANCE LINKS, MISSING PIECES, BOUNDARY WARNINGS, SPAGHETTI SCORE |
| `ZZnotforproduction/APPS/VCSM/features/booking/INDEX.md` | Source inventory counts; write surface map; security-sensitive surfaces; engine dependencies; routes: none |
| `ZZnotforproduction/APPS/VCSM/features/booking/modules/create/BEHAVIOR.md` | Customer and management booking creation flows; 3 critical invariants currently violated; status injection + customerActorId injection confirmed |
| `ZZnotforproduction/APPS/VCSM/features/booking/modules/ops/BEHAVIOR.md` | Cancel, confirm, list flows; 3 critical invariants currently violated; missing terminal-state gates; profile_id leak |
| `ZZnotforproduction/APPS/VCSM/features/booking/modules/availability/BEHAVIOR.md` | Availability rule and exception management; slot computation; 2 critical invariants currently violated; onConflict hijack vectors |
| `ZZnotforproduction/APPS/VCSM/features/booking/modules/ownership/BEHAVIOR.md` | `assertActorOwnsVportActorController` is sole management gate; hardened; 17 test assertions; slug-based QR links |
| `ZZnotforproduction/APPS/VCSM/features/booking/modules/resources/BEHAVIOR.md` | Resource add/list flows; CRITICAL: 2 dead DALs (undefined `supabase`) — slot duration + service-resource linking silently non-functional; auth bypass on list |
| `ZZnotforproduction/APPS/VCSM/features/booking/modules/services/BEHAVIOR.md` | Service and service profile load flows; all write paths dependent on broken resources DALs |

**Files confirmed absent (searched, not found):**
- `OWNERSHIP.md` — does not exist
- `TESTS.md` — does not exist

---

## §13 THOR Release Status

**THOR Release Blocker:** YES

**From SECURITY.md (2026-06-04):**

> THOR Release Blocker: YES — VEN-BOOKING-001, VEN-BOOKING-002, VEN-BOOKING-003, VEN-BOOKING-004, VEN-BOOKING-006, VEN-BOOKING-007, BW-BOOK-009, BW-BOOK-010, BW-BOOK-012, BW-BOOK-007, ELEK-2026-06-04-001, ELEK-2026-06-04-002, ELEK-2026-06-04-003

**ELEKTRA THOR blockers (from SECURITY.md):**

> ELEK-2026-06-04-001, ELEK-2026-06-04-002, ELEK-2026-06-04-003, ELEK-2026-06-04-004, ELEK-2026-06-04-005, ELEK-2026-06-04-006, ELEK-2026-06-04-007, ELEK-2026-06-04-008

**All THOR blockers:**

| Blocker ID | Severity | Summary |
|---|---|---|
| VEN-BOOKING-001 | CRITICAL | updateBookingStatusDAL no owner_actor_id filter at DAL level |
| VEN-BOOKING-002 | CRITICAL | saveBookingServiceProfileDurationsByServiceIdsDAL — undefined `supabase`, dead DAL |
| VEN-BOOKING-003 | CRITICAL | upsertBookingResourceServicesDAL — undefined `supabase`, dead DAL |
| VEN-BOOKING-004 | HIGH | createBookingController no status allowlist on INSERT |
| VEN-BOOKING-006 | HIGH | BEHAVIOR.md is a PLACEHOLDER — no security invariants declared |
| VEN-BOOKING-007 | HIGH | createBookingController accepts caller-supplied customerActorId |
| BW-BOOK-007 | MEDIUM | listOwnerBookingResourcesController no caller auth assertion |
| BW-BOOK-009 | HIGH | upsertAvailabilityRuleDAL onConflict:id cross-actor hijack |
| BW-BOOK-010 | HIGH | upsertAvailabilityExceptionDAL onConflict:id cross-actor hijack |
| BW-BOOK-012 | HIGH | confirmBookingController missing terminal-state gate |
| ELEK-2026-06-04-001 | HIGH | Availability Rule Cross-Actor Hijack |
| ELEK-2026-06-04-002 | HIGH | Availability Exception Cross-Actor Hijack |
| ELEK-2026-06-04-003 | HIGH | confirmBookingController missing terminal-state gate |
| ELEK-2026-06-04-004 | HIGH | createBookingController status not validated for management sources |
| ELEK-2026-06-04-005 | HIGH | updateBookingStatusDAL scoped to bookingId only |
| ELEK-2026-06-04-006 | HIGH | saveBookingServiceProfileDurationsByServiceIdsDAL dead DAL |
| ELEK-2026-06-04-007 | HIGH | upsertBookingResourceServicesDAL dead DAL |
| ELEK-2026-06-04-008 | HIGH | createBookingController accepts caller-supplied customerActorId |

**Note on VEN-BOOKING-006:** This blocker was specifically raised because `BEHAVIOR.md` was a placeholder with no security invariants declared. This document resolves VEN-BOOKING-006 by establishing the behavioral contract and declaring §9 Must Never Happen invariants. The finding should be reviewed for closure after this document is accepted.

**Current THOR status:** BLOCKED — booking feature is not THOR-releasable. Multiple CRITICAL and HIGH open findings across VENOM, ELEKTRA, and BlackWidow. TICKET-BOOKING-RPC-001 open. No test coverage on core lifecycle controllers (createBooking, cancelBooking, confirmBooking).

**Source:** SECURITY.md (2026-06-04); ARCHITECTURE.md — MODULE BUILD PRIORITY
