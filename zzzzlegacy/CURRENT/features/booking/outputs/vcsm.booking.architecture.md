---
# Module Architecture Report — ARCHITECT §26.11
# Feature: booking
# App: VCSM
# Ticket: ARCHITECT-BOOKING-0001
# Generated: 2026-06-02
# Status: IMMUTABLE DATED REPORT — do not modify; update ARCHITECTURE.md instead

---

# booking — Module Architecture Report

## Feature Overview

The booking feature is a three-tier system spanning the feature layer (`apps/VCSM/src/features/booking/`), the engine layer (`engines/booking/src/`), and the dashboard layer (`apps/VCSM/src/features/dashboard/vport/controller/`). It handles the full lifecycle of an appointment: creation (public customer path and owner walk-in path), confirmation, cancellation, no-show marking, completion, status updates, history reads, and availability rule management. The canonical public surface for cross-feature imports is the adapter boundary (`booking.adapter.js`). The engine layer owns the canonical write and availability logic; the feature layer owns app-specific auth gates, notification dispatch, and consumer hooks.

**Source Path:** `apps/VCSM/src/features/booking/`
**Engine Path:** `engines/booking/src/`
**Dashboard Controller Path:** `apps/VCSM/src/features/dashboard/vport/controller/`
**Security Tier:** CRITICAL
**Feature Status:** ACTIVE

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers (feature) | YES | apps/VCSM/src/features/booking/controller/ |
| DALs (feature) | YES | apps/VCSM/src/features/booking/dal/ |
| Models (feature) | YES | apps/VCSM/src/features/booking/model/ |
| Hooks (feature) | YES | apps/VCSM/src/features/booking/hooks/ |
| Screens | NO | apps/VCSM/src/features/booking/screens/ (.gitkeep only) |
| Components | NO | apps/VCSM/src/features/booking/components/ (.gitkeep only) |
| Adapters | YES | apps/VCSM/src/features/booking/adapters/booking.adapter.js |
| Engine controllers | YES | engines/booking/src/controller/ |
| Engine DALs | YES | engines/booking/src/dal/ |

Screens and components are intentionally empty. All UI surfaces are owned by the dashboard and profiles features and consume booking via the adapter boundary. This is by design.

---

## Active Controllers

### Feature Layer (14 controllers)

| Controller | Purpose | Auth Gate |
|---|---|---|
| assertActorOwnsVportActor.controller.js | Ownership assertion primitive — app callers | vc.actor_owners query; kind=user unconditional before self-shortcut (ELEK-004 fixed) |
| cancelBooking.controller.js | Owner and customer cancel path | Owner: assertActorOwnsVportActorController; Customer: customer_actor_id match only — no void/kind check (ELEK-001 OPEN) |
| confirmBooking.controller.js | Owner confirm path | assertActorOwnsVportActorController |
| createBooking.controller.js | Customer public + owner walk-in booking creation | Owner: assertActorOwnsVportActorController; Customer: actor+kind+void check; source allowlist enforced; durationMinutes capped 1–1440 |
| ensureOwnerBookingResource.controller.js | Bootstrap owner booking resource if missing | assertActorOwnsVportActorController |
| getBookingServiceProfiles.controller.js | Service profiles for booking form | Public read |
| getResourceAvailability.controller.js | Compute available slots | Public read; in-memory invalidation supported |
| listMyBookings.controller.js | Customer appointment history | Session-scoped actorId |
| listOwnerBookingResources.controller.js | List owner resources | ownerActorId from caller context |
| resolveVportProfileId.controller.js | Map actorId to vport profileId | Public read |
| bookingServices.controller.js | Public service catalog reads | Public read |
| setAvailabilityException.controller.js | Create/update availability exception | Via engine assertActorCanManageResource |
| setAvailabilityRule.controller.js | Create/update availability rule | Via engine assertActorCanManageResource |
| setResourceSlotDuration.controller.js | Set slot duration on resource | assertActorOwnsVportActorController |

### Engine Layer (28 controllers — canonical write authority)

assertActorOwnsVportActor, assertActorCanManageResource, assertActorCanManageLocation, assertActorCanManageOrganization, createBooking, cancelBooking, confirmBooking, completeBooking, markNoShow, dismissBooking, getLocationAvailability, getResourceAvailability, setAvailabilityRule, setAvailabilityException, setResourceSlotDuration, ensureOwnerBookingResource, listOwnerBookingResources, listBookingHistory, listBookingResourcesByLocation, listLocationsByOrganization, listOrganizationsByOwnerActor, createLocationResource, createOrganizationLocationWorkspace, listQrLinks, createQrLink, resolveBookingContext, resolveQrScan, listResourceServiceOverrides, upsertResourceServiceOverride, getBookingServiceProfiles.

### Deleted / Superseded

| Controller | Reason |
|---|---|
| manageVportAvailabilityRule.controller.js (dashboard) | DELETED — write path migrated to engine (V-AVAIL-01 fix) |
| listVportBookingHistory.controller.js (feature-level) | DEAD — no callers; DELETE CANDIDATE |

---

## Active DALs

### Feature Layer (22 DALs)

| DAL | Tables | Notes |
|---|---|---|
| getActorById.dal.js | vc.actors | READ — auth gate support |
| readActorOwnerLinkByActorAndUserProfile.dal.js | vc.actor_owners | READ — core ownership verification |
| getBookingById.dal.js | vport.bookings | READ — 22-column explicit select (K-BOOK-02 overfetch) |
| getBookingResourceById.dal.js | vport.resources | READ |
| getVportProfileIdByActorId.dal.js | vport.profiles | READ |
| getVportSlugByActorId.dal.js | vport.profiles | READ — slug for notification linkPath (VPD-V-020 fix) |
| insertBooking.dal.js | vport.bookings | WRITE INSERT — column-allowlisted; TICKET-BOOKING-RPC-001 |
| listBookingResourceServicesByResourceId.dal.js | vport.resource_services | READ — service-link validation in createBooking |
| listBookingServiceProfilesByServiceIds.dal.js | vport.service_booking_profiles | READ |
| listBookingsByCustomer.dal.js | vport.bookings | READ — member_actor_id exposure (V-BOOK-03 OPEN) |
| readVportServicesByActor.dal.js | vport.profiles + vport.services | READ |
| updateBookingStatus.dal.js | vport.bookings | WRITE UPDATE — no row ownership filter; PII overfetch on response (V-BOOK-02 OPEN) |
| insertBookingResource.dal.js | vport.resources | DEAD — engine owns |
| listAvailabilityExceptionsInRange.dal.js | vport.availability_exceptions | DEAD — engine owns |
| listAvailabilityRulesByResourceId.dal.js | vport.availability_rules | DEAD — engine owns |
| listBookingResourcesByOwnerActorId.dal.js | vport.resources | DEAD — engine owns |
| listBookingsByResource.dal.js | vport.bookings | DEAD — engine owns |
| listBookingsInRange.dal.js | vport.bookings | DEAD — engine owns |
| saveBookingServiceProfileDurationsByServiceIds.dal.js | vport.service_booking_profiles | DEAD — engine owns |
| upsertAvailabilityException.dal.js | vport.availability_exceptions | DEAD — engine owns |
| upsertAvailabilityRule.dal.js | vport.availability_rules | DEAD — engine owns |
| upsertBookingResourceServices.dal.js | vport.resource_services | DEAD — engine owns |

**Dead DAL count: 12 confirmed** — all write operations migrated to engine canonical path.

### Engine Layer (20 DALs)

actor.read, availability.read, availability.write, booking.read, booking.write, location.read, location.write, organization.read, organization.write, qrLink.read, qrLink.write, resource.read, resource.write, resourceServiceOverride.read, resourceServiceOverride.write, serviceProfile.read, serviceProfile.write, vportAvailability.read, vportAvailability.write, vportBooking.read, vportBooking.write, vportResource.read, vportResource.write.

---

## Active Hooks (16)

| Hook | What It Calls | Purpose |
|---|---|---|
| useCreateBooking.js | createBooking (@booking) | Booking creation mutation |
| useBookingAvailability.js | getResourceAvailability (@booking) | Slot availability reads |
| useManageAvailability.js | cancelBooking, confirmBooking, completeBooking, markNoShow, setResourceSlotDuration, setAvailabilityException, setAvailabilityRule (all @booking) | Owner management bundle |
| useOwnerBookingResources.js | listOwnerBookingResources (@booking) | Owner resource list |
| useEnsureOwnerBookingResource.js | ensureOwnerBookingResource (@booking) | Bootstrap resource |
| useBookingServiceProfiles.js | getBookingServiceProfiles (@booking) | Service profiles for booking form |
| useOrganizationWorkspace.js | listOrganizationsByOwnerActor, listLocationsByOrganization (@booking) | Org/location workspace reads |
| useOrganizationLocations.js | listLocationsByOrganization (@booking) | Location list |
| useLocationResources.js | listBookingResourcesByLocation (@booking) | Resources for location |
| useResourceServiceOverrides.js | listResourceServiceOverrides, upsertResourceServiceOverride (@booking) | Service price/duration overrides |
| useBookingContextResolver.js | resolveBookingContext (@booking) | Booking session context |
| useQrLinks.js | listQrLinksByProfile, createQrLink (@booking) + resolveVportProfileIdController (feature-local) | QR link management |
| useBookingOps.js | listMyBookingsController, cancelBookingController (feature-local) | Customer booking ops |
| useBookingServices.js | bookingServices.controller (feature-local) | Service catalog reads |
| useBookingHistory.js | listBookingHistory (@booking) | Owner booking history |
| useAddStaffResource.js | createLocationResource (@booking) | Add staff/resource |

---

## Engine Dependencies

| Engine | Import Path | Purpose |
|---|---|---|
| @booking (engines/booking) | `@booking` alias | All availability, history, creation, confirmation, cancellation, QR, org/location controllers |
| configureBookingEngine | setup.js | Wires supabase + vportClient + notifyFn at app startup |

---

## Cross-Feature Dependencies

| Feature | What Is Imported | Direction |
|---|---|---|
| notifications | `publishVcsmNotification` via `@/features/notifications/adapters/notifications.adapter` | booking → notifications (adapter-compliant, §5.3) |

---

## Authorization Pattern

All owner-path mutations are gated by `assertActorOwnsVportActorController` before any write:
1. requester actor lookup — non-null, not void, `kind` must equal `"user"` (unconditional, before self-shortcut)
2. self-shortcut — if `requestActorId === targetActorId` and kind confirmed `user`, skip DB query
3. `actor_owners` DB query — verifies ownership link with `profile_id` cross-check

Public (customer) path enforces: actor exists, not void, kind equals `"user"`. No owner gate on public reads.

**Open gap:** `cancelBookingController` customer path checks only `customer_actor_id` match — no void/kind check (ELEK-001 OPEN). A void actor with a valid session token can cancel.

---

## Module Independence Classification

**DEPENDENT**

The feature layer depends heavily on `engines/booking` for all write and history operations via the `@booking` alias. Feature DALs serve app-layer auth gates and legacy dead code. Engine is the canonical write authority.

---

## Architecture State

**EVOLVING**

Structurally complete with documented adapter boundary, three-tier wiring, and engine delegation. Not production-clear: TICKET-BOOKING-RPC-001 (DB-BLOCKED), ELEK-001 (customer cancel gap), BLOCK-BOOK-002 (zero regression tests), 12 dead DALs + 8 dead controllers, dual assertActorOwnsVportActor drift risk.

---

## Known Structural Risks

1. **TICKET-BOOKING-RPC-001 (P0 / DB-BLOCKED):** customer_actor_id injection + status overpermission confirmed on live DB. Broad INSERT/UPDATE must become typed state-machine RPCs.
2. **ELEK-001 (MEDIUM / OPEN):** cancelBookingController customer path — no void/kind check. One-file fix, no DB.
3. **Dual assertActorOwnsVportActor (DRIFT RISK):** Feature and engine implementations can diverge. Long-term: consolidate to engine canonical.
4. **BW-SCHED-003 (OPEN):** loadDayScheduleController exported from module index.js — architecture boundary violation.
5. **Dead Code (12 DALs + 8 controllers):** All confirmed by IRONMAN. Awaiting CARNAGE batch removal.
6. **V-BOOK-02/03/04 (HIGH / OPEN):** PII overfetch; member_actor_id exposure; linkPath UUID remnants.
7. **N+1 risk on loadDayScheduleController:** Fires N parallel reads for large teams. Batch DAL needed.
8. **BLOCK-BOOK-002 (P0):** Zero regression tests across all security fixes. Merge unsafe.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | DR_STRANGE.md, ARCHITECTURE.md | None |
| Owner defined | PARTIAL | ownership.md (legacy) | No canonical OWNERSHIP.md |
| Entry points mapped | PASS | booking.adapter.js; setup.js | None |
| Controllers present | PASS | 14 feature + 28 engine controllers | 8 dead feature controllers |
| DAL/repository present | PASS | 22 feature + 20 engine DALs | 12 dead feature DALs |
| Models/transformers | PASS | 11 feature + 9 engine models | None |
| Hooks/view models | PASS | 16 hooks | None |
| Screens/components | FAIL | screens/ and components/ empty (.gitkeep) | By design — screens owned by dashboard/profiles |
| Authorization path mapped | PARTIAL | assertActorOwnsVportActorController documented | ELEK-001 customer cancel gap open |
| Engine dependencies mapped | PASS | @booking alias + configureBookingEngine | Dual assertActorOwnsVportActor drift risk |
| Tests/validation noted | FAIL | 1 test file (feature) + 3 (engine) | 14 SPIDER-MAN gaps; zero regression tests for security fixes |

---

## Recommended Handoffs

- **SPIDER-MAN** — P0; zero regression tests; minimum 5 files (SPM-003, SPM-004, SPM-002, SPM-S2-001, SPM-S2-002)
- **ELEKTRA** — ELEK-001; customer cancel one-file fix; no DB required
- **CARNAGE** — dead DAL/controller removal (12+8); {public} role cleanup migration; N+1 batch DAL
- **VENOM** — post-RPC migration security pass for V-BOOK-02/03/04
- **DB** — TICKET-BOOKING-RPC-001 typed state-machine RPCs
- **IRONMAN** — canonical OWNERSHIP.md

---

## Final Module Status

**MOSTLY_COMPLETE**

Three-tier architecture with adapter boundary, full controller/DAL/hook/model coverage, engine dependency wiring, and extensive governance evidence. Not COMPLETE due to: TICKET-BOOKING-RPC-001 (DB-BLOCKED P0), ELEK-001, zero regression tests (P0), 12 dead DALs + 8 dead controllers, dual assertActorOwnsVportActor drift risk, missing canonical OWNERSHIP.md.

---

## ARCHITECT Run Record

- Date: 2026-06-02
- Ticket: ARCHITECT-BOOKING-0001
- Architecture State: EVOLVING
- Module Status: MOSTLY_COMPLETE
- Security Tier: CRITICAL
- Feature Status: ACTIVE
- Source Files Scanned (feature): 63
- Source Files Scanned (engine): 68
- Total: 131 files
- Controllers Found: 14 (feature) + 28 (engine) = 42 total
- DALs Found: 22 (feature) + 20 (engine) = 42 total
- Hooks Found: 16 (feature)
- Models Found: 11 (feature) + 9 (engine) = 20 total
- Tests Found: 1 (feature) + 3 (engine) = 4 total
- Dead DALs Confirmed: 12
- Dead Controllers Confirmed: 8
- Engine Deps: [@booking]
- Cross-Feature Deps: [notifications]
- Structural Risks: [TICKET-BOOKING-RPC-001, ELEK-001, dual-assertActorOwnsVportActor-drift, BW-SCHED-003, dead-code-12-dals+8-controllers, V-BOOK-02/03/04, N+1-availability, BLOCK-BOOK-002]
- Recommended Next Command: SPIDER-MAN
