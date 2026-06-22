---
name: vcsm.booking.index
description: VCSM booking feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / booking

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 15 (fm) / 19 (cg) | create, cancel, confirm, assertOwnership, availability, resource, services |
| DAL files | 22 (fm) / 33 (cg) | insert/update bookings, upsert availability, list queries, owner link reads |
| Hooks | 16 (fm) / 17 (cg) | useCreateBooking, useBookingOps, useBookingAvailability, useManageAvailability, useOwnerBookingResources + 12 more |
| Models | 11 (fm) / 41 (cg) | booking.model, bookingAvailability, buildSlots, buildBookingPayload, bookingCalendar + calendar sub-models |
| Screens | 0 | screens/.gitkeep — no screens; UI lives in dashboard and profiles consumers |
| Components | 0 | components/.gitkeep — no components |
| Adapters | 1 | booking.adapter.js — 13 hook exports + 2 approved §5.3 exceptions |
| Barrels | 28 (cg) | Resolved via callgraph; includes engine barrel re-exports via @booking alias |
| Tests | 1 | assertActorOwnsVportActor.controller.test.js (17 assertions, Vitest) |
| Routes | 0 | No routes in route-map — feature entered via engine/adapter imports only |
| Total source files | 66 | Feature-map source file count |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| insert | (default) | bookings | insertBookingDAL |
| insert | (default) | resources | insertBookingResourceDAL |
| insert | vc | service_booking_profiles | saveBookingServiceProfileDurationsByServiceIdsDAL |
| update | vc | service_booking_profiles | saveBookingServiceProfileDurationsByServiceIdsDAL |
| update | (default) | bookings | updateBookingStatusDAL |
| upsert | (default) | availability_exceptions | upsertAvailabilityExceptionDAL |
| upsert | (default) | availability_rules | upsertAvailabilityRuleDAL |
| upsert | vc | resource_services | upsertBookingResourceServicesDAL |

## Security-Sensitive Surfaces

**bookings (insert/update):** High sensitivity. Booking records are financial/transactional objects tied to actor identities. Raw INSERT without a typed state-machine RPC means status can be set arbitrarily by the caller — TICKET-BOOKING-RPC-001 is open on this surface. The `customer_actor_id` injection risk is also documented in this ticket.

**availability_rules / availability_exceptions (upsert):** Medium sensitivity. Owner gate (`assertActorOwnsVportActorController`) must be enforced upstream before these surfaces are reached. No DB-level enforcement observed in static scan — relies on controller-layer ownership check only.

**resources (insert):** Medium sensitivity. Resource creation scoped to owner actor; `ensureOwnerBookingResourceController` enforces ownership before insert.

**actor_owners (read):** High sensitivity — core ownership verification table. `readActorOwnerLinkByActorAndUserProfile.dal.js` is the security linchpin for all management-source booking operations. ELEK-004 hardening confirmed in source.

## Engine Dependencies

- availability
- booking
- hydration
- notification
- profile
- qr

## Routes

No routes in route-map for this feature. The booking feature is consumed as a library via the `@booking` engine alias and the `booking.adapter.js` adapter surface. Entry points are invoked by dashboard, profiles, and join features.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — PLACEHOLDER (no behavioral spec content) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
