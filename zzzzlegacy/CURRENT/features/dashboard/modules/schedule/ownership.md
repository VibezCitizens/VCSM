# Schedule — Ownership and Trust Boundaries

## Ownership Gate

| Path | Gate | Reference |
|---|---|---|
| `loadDayScheduleController` | `assertActorOwnsVportActorController(callerActorId, actorId)` | VPD-V-022 — before any resource or booking read |
| Create booking (delegated) | Ownership gate in `createOwnerBookingController` | `cards/bookings/controller/createOwnerBooking.controller.js` |
| Update booking status (delegated) | Ownership gate in `updateBookingStatusController` | `cards/bookings/controller/updateVportBooking.controller.js` |
| Reschedule booking (delegated) | Ownership gate in `rescheduleBookingController` | `cards/bookings/controller/updateVportBooking.controller.js` |

## Data Sensitivity

The day schedule payload returned by `loadDayScheduleController` includes:

- `booking.customerName` — PII-adjacent (customer name from booking record)
- `booking.customerNote` — booking notes (may contain customer-supplied PII)

Both fields are owner-only. The controller-level ownership gate (VPD-V-022) is the single enforcement point. DB-level RLS for the bookings read path used by this surface has not been verified.

## Booking Delegation Boundary

The schedule card delegates all booking mutations to `cards/bookings/` controllers. It does not bypass the booking module's ownership gates — `callerActorId` is passed through from `useVportOwnerSchedule` to each booking controller call, which verifies ownership independently.

## DB-Level RLS

**NEEDS_VERIFICATION** — no RLS audit performed for this module's read tables (`vport.resources`, `vport.availability_rules`, `vport.bookings`/equivalent). Application-layer gate is the current enforcement layer.
