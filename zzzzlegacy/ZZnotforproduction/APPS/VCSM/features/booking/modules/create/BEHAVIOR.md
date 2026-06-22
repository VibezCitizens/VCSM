---
title: Create Module — Behavior
status: STUB
feature: booking
module: create
source: architect-derived
created: 2026-06-05
---

# booking / modules / create — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Customer Booking Flow
- Customer selects VPORT, service, date/time from booking UI (in profiles consumer)
- useCreateBooking → createBooking.controller (customer source)
- customerActorId from caller — SECURITY GAP: no session binding verification
- status passed from caller — SECURITY GAP: no allowlist enforced
- insertBookingDAL writes booking record (raw INSERT, no state-machine RPC)

### Owner/Management Booking Flow
- Owner creates booking on behalf of customer from dashboard
- createBooking.controller (management source) — ownership check via assertActorOwnsVportActor
- customerActorId from caller — same injection risk as customer path

### Context Resolution
- useBookingContextResolver determines booking source (customer vs management)
- Context drives which ownership path is taken in createBooking.controller

## Critical Invariants (CURRENTLY VIOLATED)

1. `status` on INSERT must be `pending` only — no other status may be set by caller
2. `customerActorId` must be derived from authenticated session — not accepted from caller
3. All booking INSERTs must go through typed state-machine RPC (TICKET-BOOKING-RPC-001)

## TODO

- [ ] Confirm createBooking.controller.js status parameter source
- [ ] Confirm customerActorId derivation path in both source types
- [ ] Confirm post-create notification linkPath construction (raw UUID or slug?)
