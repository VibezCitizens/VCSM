# Runtime Feature Index: booking

## Metadata

| Field | Value |
|---|---|
| Feature | booking |
| CURRENT Folder | CURRENT/features/booking |
| Source Folder | apps/VCSM/src/features/booking |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 14 | assertActorOwnsVportActor, cancelBooking, confirmBooking, createBooking, ensureOwnerBookingResource, getBookingServiceProfiles, getResourceAvailability, listMyBookings, listOwnerBookingResources, resolveVportProfileId, bookingServices, setAvailabilityException, setAvailabilityRule, setResourceSlotDuration |
| DALs | 22 | getActorById, getBookingById, getBookingResourceById, getVportProfileIdByActorId, getVportSlugByActorId, insertBooking, insertBookingResource, listAvailabilityExceptionsInRange, listAvailabilityRulesByResourceId, listBookingResourceServicesByResourceId, listBookingResourcesByOwnerActorId, listBookingServiceProfilesByServiceIds, listBookingsByCustomer, listBookingsByResource, listBookingsInRange, readActorOwnerLinkByActorAndUserProfile, readVportServicesByActor, saveBookingServiceProfileDurationsByServiceIds, updateBookingStatus, upsertAvailabilityException, upsertAvailabilityRule, upsertBookingResourceServices |
| Hooks | 16 | useAddStaffResource, useBookingAvailability, useBookingContextResolver, useBookingHistory, useBookingOps, useBookingServiceProfiles, useBookingServices, useCreateBooking, useEnsureOwnerBookingResource, useLocationResources, useManageAvailability, useOrganizationLocations, useOrganizationWorkspace, useOwnerBookingResources, useQrLinks, useResourceServiceOverrides |
| Models | 11 | booking.model, bookingAvailability.model, bookingCalendar.model, bookingCalendarAvailability.model, bookingCalendarDate.model, bookingResource.model, bookingServiceProfile.model, buildAgenda.model, buildBookingPayload.model, buildBookings.model, buildSlots.model |
| Screens | 0 | NONE — screens/ directory exists but contains only .gitkeep; screens owned by dashboard/vport and profiles features |
| Components | 0 | NONE — components/ directory exists but contains only .gitkeep |
| Routes | 2 | /actor/:actorId/dashboard/calendar (owner, dashboard card), /:vportSlug?tab=book (public customer) |
| Tests | 1 | controller/__tests__/assertActorOwnsVportActor.controller.test.js |

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /actor/:actorId/dashboard/calendar | apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/VportDashboardCalendarScreen.jsx | OWNER | Booking calendar card — dashboard card owned by dashboard feature |
| /actor/:actorId (book tab) | apps/VCSM/src/features/profiles/kinds/vport/screens/booking/ | PUBLIC | Customer-facing booking initiation |
| /actor/:actorId/dashboard/booking-history | apps/VCSM/src/features/dashboard/vport/screens/ | OWNER | Owner booking history — dashboard-owned screen |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| createBooking.controller.js | booking/controller/ | INSERT bookings | PARTIAL — owner path: assertActorOwnsVportActorController YES; customer path: actor+kind check, no status/customerActorId gate | CRITICAL |
| cancelBooking.controller.js | booking/controller/ | UPDATE bookings.status | PARTIAL — owner: assertActorOwnsVportActorController YES; customer: customer_actor_id match only, NO void/kind check (ELEK-001 OPEN) | HIGH |
| confirmBooking.controller.js | booking/controller/ | UPDATE bookings.status | YES — assertActorOwnsVportActorController | HIGH |
| updateBookingStatus.dal.js | booking/dal/ | UPDATE bookings | NO row-level ownership filter — accepts any bookingId; owned via controller gates only | CRITICAL |
| insertBooking.dal.js | booking/dal/ | INSERT bookings | Column-allowlisted; no row-level ownership filter — owned via controller gates only | CRITICAL |
| setAvailabilityRule.controller.js | booking/controller/ | INSERT/UPDATE availability_rules | YES — via engine assertActorCanManageResource | MEDIUM |
| setAvailabilityException.controller.js | booking/controller/ | INSERT/UPDATE availability_exceptions | YES — via engine assertActorCanManageResource | MEDIUM |
| setResourceSlotDuration.controller.js | booking/controller/ | UPDATE resources | YES — assertActorOwnsVportActorController | MEDIUM |
| ensureOwnerBookingResource.controller.js | booking/controller/ | INSERT resources | YES — assertActorOwnsVportActorController | MEDIUM |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| createBooking.controller.js | booking/controller/ | OWNERSHIP + DB_RLS | customer_actor_id injection confirmed on live DB — TICKET-BOOKING-RPC-001 OPEN |
| cancelBooking.controller.js | booking/controller/ | OWNERSHIP | No void/kind check on customer cancel path — ELEK-001 OPEN |
| updateBookingStatus.dal.js | booking/dal/ | PII_OVERFETCH | 22-column response includes PII on status update — V-BOOK-02 OPEN |
| listBookingsByCustomer.dal.js | booking/dal/ | PII_EXPOSURE | Exposes member_actor_id in customer-facing reads — V-BOOK-03 OPEN |
| assertActorOwnsVportActor.controller.js | booking/controller/ | OWNERSHIP | Dual implementation with engines/booking — drift risk documented (IRON-BOOK-WARN3) |
| @booking engine controllers | engines/booking/src/controller/ | ENGINE_BOUNDARY | assertActorOwnsVportActor parity with feature layer must be maintained |
| DB booking policies | vport schema | DB_RLS | 6 untracked live RLS policies; 4 UPDATE + 1 SELECT use {public} instead of {authenticated} — MEDIUM governance |

## Engine Dependency Map

| Engine | Import Pattern | Surfaces |
|---|---|---|
| @booking (engines/booking) | `import { ... } from "@booking"` | 14 of 16 hooks delegate to engine controllers; setup.js configures engine at startup |
| Engine boot | `configureBookingEngine` in apps/VCSM/src/features/booking/setup.js | Wires supabase, vportClient, notifyFn at app startup |

## Audit / Ticket Evidence From CURRENT

| Item | Status | Source CURRENT File |
|---|---|---|
| TICKET-BOOKING-RPC-001 — customer_actor_id injection + status overpermission | OPEN / DB-BLOCKED | features/booking/ticket_booking_rpc_001.md |
| BLOCK-BOOK-002 — zero regression tests for all security fixes | OPEN / SPIDER-MAN BLOCKED | features/booking/CURRENT_STATUS.md |
| ELEK-001 — customer cancel path missing void/kind check | OPEN | features/booking/CURRENT_STATUS.md |
| V-BOOK-02/03/04 (HIGH) | OPEN — carries forward | features/booking/SECURITY.md |
| BW-SCHED-001/002/003, BW-CAL-002 (MEDIUM) | OPEN | features/booking/findings.md |
| THOR Gate 3 — CAUTION CLEARED (2026-05-27) with ELEK-001 condition | CLEARED WITH CONDITION | features/booking/2026-05-27_thor_booking-module-deferred-gate.md |
| VENOM multiple passes (2026-05-14, 2026-05-27) | COMPLETE | features/booking/SECURITY.md |
| ELEKTRA passes (2026-05-27, 2026-05-28) | COMPLETE | features/booking/2026-05-27_20-00_elektra_tab-classification.md |
| SPIDER-MAN — BLOCKED (7 CRITICAL + 7 HIGH gaps, zero tests) | BLOCKED | features/booking/CURRENT_STATUS.md |
| Dead code — 12 DALs + 8 controllers confirmed | AWAITING CARNAGE | features/booking/ARCHITECTURE.md |
| ARCHITECT-BOOKING-0001 | COMPLETE | features/booking/ARCHITECTURE.md (this run) |

## Runtime Risk Summary

Booking is a CRITICAL-tier, high-complexity feature (63 source files, 14 feature controllers, 22 feature DALs, 16 hooks; plus 68 engine files). The highest risk is the write surface: `customer_actor_id` injection and status overpermission are confirmed on the live DB and are the subject of TICKET-BOOKING-RPC-001 (DB-BLOCKED P0). The broad `updateBookingStatus.dal.js` has no row-level ownership filter — controller gates are the only protection. `cancelBookingController` customer path has no void/kind check (ELEK-001 OPEN). PII overfetch on status update DAL response is documented (V-BOOK-02). A public booking initiation surface exists. SPIDER-MAN is BLOCKED with zero regression tests across all security fixes — merge is unsafe. 12 dead DALs and 8 dead controllers awaiting removal add code surface without functionality. DR.STRANGE readiness score: 52% (PARTIAL — not merge-safe).

## Recommended Next Command

**SPIDER-MAN** — zero regression tests is the most urgent gap blocking merge safety.

## Recommended Next Ticket

Advance TICKET-BOOKING-RPC-001 when DB migration window opens. Before that: open a scoped ticket for ELEK-001 (one-file controller fix, no DB required) and a SPIDER-MAN test coverage ticket for the 5 minimum regression test files (SPM-003, SPM-004, SPM-002, SPM-S2-001, SPM-S2-002) to unblock merge.
