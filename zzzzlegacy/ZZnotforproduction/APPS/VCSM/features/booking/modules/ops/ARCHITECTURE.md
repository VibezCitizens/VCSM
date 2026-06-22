---
title: Ops Module — Architecture
status: STUB
feature: booking
module: ops
source: architect-derived
created: 2026-06-05
---

# booking / modules / ops — ARCHITECTURE

## Layer Stack

```
[dashboard consumer]
  └── booking.adapter.js
        └── useBookingOps.js
              ├── cancelBooking.controller.js
              │     ├── assertActorOwnsVportActor (ownership check)
              │     ├── [NO terminal-state gate — THOR BLOCKER]
              │     └── updateBookingStatusDAL (id only — no owner filter — THOR BLOCKER)
              │
              └── confirmBooking.controller.js
                    ├── assertActorOwnsVportActor (ownership check)
                    ├── [NO terminal-state gate — THOR BLOCKER]
                    └── updateBookingStatusDAL (id only — no owner filter — THOR BLOCKER)
```

## Update DAL Gap

```
updateBookingStatus.dal.js:
  supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)      ← id only, no owner filter
                              ← RLS is sole barrier
```

## History Read

```
useBookingHistory.js
  └── listMyBookings.controller.js
        └── listBookingsByCustomer.dal.js → SELECT ... profile_id ← internal ID surfaced
              └── booking.model.js → customerProfileId exposed in model
```

## TODO

- [ ] Add owner_actor_id filter to updateBookingStatusDAL
- [ ] Add terminal-state checks to cancel and confirm controllers
- [ ] Remove profile_id from listBookingsByCustomerDAL SELECT
