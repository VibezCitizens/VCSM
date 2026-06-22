---
title: Ops Module — Index
status: STUB
feature: booking
module: ops
source: architect+venom+elektra+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/booking/
scanner-version: 1.1.0
---

# booking / modules / ops

Booking state transitions (cancel, confirm, status update) and history reads. **THOR BLOCKERS: unscoped UPDATE, no terminal-state gates, raw UUID in notification linkPath, profile_id surfaced in model.**

## Module Summary

| Field | Value |
|---|---|
| Module | ops |
| Feature | booking |
| Source Path | apps/VCSM/src/features/booking/ |
| Screens | 0 |
| Write Surfaces | bookings UPDATE (status), cancel, confirm |
| Controllers | 3 (cancelBooking, confirmBooking, listMyBookings) |
| DAL Files | 5 (updateBookingStatus, getBookingById, listBookingsByCustomer, listBookingsInRange, listBookingsByResource) |
| Hooks | 3 (useBookingOps, useBookingHistory, useOrganizationWorkspace) |
| Models | 2 (bookingCalendar, buildAgenda) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| controller/cancelBooking.controller.js | Controller | Booking cancellation + notification |
| controller/confirmBooking.controller.js | Controller | Booking confirmation + notification |
| controller/listMyBookings.controller.js | Controller | Customer booking history |
| dal/updateBookingStatus.dal.js | DAL | bookings UPDATE by bookingId only (THOR BLOCKER) |
| dal/getBookingById.dal.js | DAL | Single booking read |
| dal/listBookingsByCustomer.dal.js | DAL | Customer booking list — surfaces profile_id (THOR BLOCKER) |
| dal/listBookingsInRange.dal.js | DAL | Bookings in date range |
| dal/listBookingsByResource.dal.js | DAL | Bookings by resource |
| hooks/useBookingOps.js | Hook | Cancel/confirm mutations |
| hooks/useBookingHistory.js | Hook | Customer booking history query |
| hooks/useOrganizationWorkspace.js | Hook | Organization workspace context |
| model/bookingCalendar.model.js | Model | Calendar view normalization |
| model/buildAgenda.model.js | Model | Agenda view assembly |

## Write Surface Map

| Operation | Table | Guard | Risk |
|---|---|---|---|
| UPDATE status | bookings | bookingId only — no owner filter | THOR BLOCKER: VEN-BOOKING-001 |
| cancel | bookings | ownership check; NO terminal-state gate | THOR BLOCKER: ELEK-003 |
| confirm | bookings | ownership check; NO terminal-state gate | THOR BLOCKER: ELEK-003 |

## Security Flags

- **THOR BLOCKER** CRITICAL: VEN-BOOKING-001 / ELEK-2026-06-04-005 — updateBookingStatusDAL UPDATE scoped to bookingId only; no owner_actor_id filter; RLS is sole barrier
- **THOR BLOCKER** HIGH: ELEK-2026-06-04-003 / BW-BOOK-012 — confirmBookingController missing terminal-state gate; cancelled/completed bookings can be re-confirmed
- **THOR BLOCKER** MEDIUM: ELEK-2026-06-04-009 / BW-BOOK-013 — cancelBookingController missing terminal-state guard; re-cancel mutates cancelled_at and internalNote
- **THOR BLOCKER** MEDIUM: VEN-BOOKING-009 / ELEK-2026-06-04-011 / BW-BOOK-015 — createBookingController line 138 raw owner_actor_id UUID in notification linkPath (cancel/confirm fixed, create NOT fixed)
- MEDIUM: VEN-BOOKING-010 / ELEK-2026-06-04-012 — listBookingsByCustomerDAL selects and returns profile_id (internal DB identifier); surfaced as customerProfileId in booking.model

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm updateBookingStatusDAL — exact query, confirm no owner_actor_id filter
- [ ] Add terminal-state guard to cancelBooking and confirmBooking controllers
- [ ] Fix raw UUID in createBooking notification linkPath (line 138)
- [ ] Remove profile_id from listBookingsByCustomerDAL select
