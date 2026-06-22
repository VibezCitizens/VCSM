---
title: Ops Module — Behavior
status: STUB
feature: booking
module: ops
source: architect-derived
created: 2026-06-05
---

# booking / modules / ops — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Cancel Booking
- Owner or customer cancels a booking via useBookingOps
- cancelBooking.controller verifies ownership, then calls updateBookingStatusDAL
- SECURITY GAP: no terminal-state gate — cancelled bookings can be re-cancelled (mutates cancelled_at, internalNote)
- Sends cancellation notification (linkPath uses slug — VEN-BOOKING-005 FIXED)

### Confirm Booking
- Owner confirms a pending booking via useBookingOps
- confirmBooking.controller verifies ownership, then calls updateBookingStatusDAL
- SECURITY GAP: no terminal-state gate — cancelled/completed bookings can be re-confirmed

### Status Update
- updateBookingStatusDAL executes UPDATE bookings WHERE id = bookingId
- CRITICAL GAP: no owner_actor_id filter at DAL level — RLS is sole barrier

### List Customer Bookings
- listMyBookings.controller → listBookingsByCustomer.dal → returns bookings for customer
- MEDIUM GAP: profile_id returned in DAL result — internal DB identifier surfaced in model

## Critical Invariants (CURRENTLY VIOLATED)

1. Cancel must be idempotent — re-cancel of cancelled booking must be a no-op
2. Confirm must check current status — terminal-state bookings must not be re-confirmed
3. updateBookingStatusDAL must filter by owner_actor_id (not rely on RLS alone)

## TODO

- [ ] Confirm cancelBooking.controller.js — what states are considered terminal?
- [ ] Confirm confirmBooking.controller.js — same terminal state check
- [ ] Confirm updateBookingStatusDAL exact query — missing owner filter confirmed?
