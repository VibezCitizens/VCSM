---
title: Create Module — Index
status: STUB
feature: booking
module: create
source: architect+venom+elektra+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/booking/
scanner-version: 1.1.0
---

# booking / modules / create

Customer and owner booking creation flow. **THOR BLOCKERS: status allowlist missing, customerActorId injection.** Raw INSERT (no state-machine RPC) — TICKET-BOOKING-RPC-001 open.

## Module Summary

| Field | Value |
|---|---|
| Module | create |
| Feature | booking |
| Source Path | apps/VCSM/src/features/booking/ |
| Screens | 0 (UI in dashboard/profiles consumers) |
| Write Surfaces | bookings INSERT, resources INSERT |
| Controllers | 1 (createBooking) |
| DAL Files | 2 (insertBooking, insertBookingResource) |
| Hooks | 2 (useCreateBooking, useBookingContextResolver) |
| Models | 3 (booking, buildBookingPayload, buildBookings) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| controller/createBooking.controller.js | Controller | Booking creation orchestration — customer + owner/mgmt paths |
| dal/insertBooking.dal.js | DAL | bookings INSERT (raw — no RPC) |
| dal/insertBookingResource.dal.js | DAL | resources INSERT |
| hooks/useCreateBooking.js | Hook | Booking creation mutation |
| hooks/useBookingContextResolver.js | Hook | Context resolution for booking source |
| model/booking.model.js | Model | Booking shape + normalization |
| model/buildBookingPayload.model.js | Model | Booking insert payload assembly |
| model/buildBookings.model.js | Model | Booking list normalization |

## Write Surface Map

| Operation | Table | Guard |
|---|---|---|
| INSERT bookings | bookings | ownership check via assertActorOwnsVportActor (mgmt path); NO status allowlist (THOR BLOCKER) |
| INSERT resources | resources | ensureOwnerBookingResource ownership gate |

## Security Flags

- **THOR BLOCKER** HIGH: VEN-BOOKING-004 / ELEK-2026-06-04-004 — createBookingController passes caller-supplied `status` directly to insertBookingDAL; no status allowlist enforced; any status including terminal can be inserted
- **THOR BLOCKER** HIGH: VEN-BOOKING-007 / ELEK-2026-06-04-008 / BW-BOOK-003 — createBookingController accepts caller-supplied `customerActorId` for all sources; owner can attribute bookings to any actor without consent or verification; requestActorId trusted without session binding
- **OPEN TICKET**: TICKET-BOOKING-RPC-001 — raw INSERT must be replaced with typed state-machine RPC

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm createBooking.controller.js status values passed to insertBookingDAL
- [ ] Confirm customerActorId source — URL param, hook arg, or session-derived?
- [ ] Read TICKET-BOOKING-RPC-001 — typed RPC migration plan
