---
title: Create Module — Architecture
status: STUB
feature: booking
module: create
source: architect-derived
created: 2026-06-05
---

# booking / modules / create — ARCHITECTURE

## Layer Stack

```
[profiles / dashboard consumer]
  └── booking.adapter.js (public surface)
        └── useCreateBooking.js
              └── createBooking.controller.js
                    ├── [customer source]
                    │     └── insertBookingDAL (raw INSERT — no RPC, status unguarded)
                    │
                    └── [management source]
                          ├── assertActorOwnsVportActor.controller (ownership gate)
                          └── insertBookingDAL (raw INSERT — status unguarded, customerActorId injection)
```

## Notification Path (SECURITY GAP)

```
createBooking.controller.js line 138
  └── notification linkPath = `/vport/${owner_actor_id}/...`  ← raw UUID (THOR BLOCKER)
      (cancel + confirm paths were fixed; create was not)
```

## Correct Architecture (TICKET-BOOKING-RPC-001)

```
createBooking.controller.js
  └── typed state-machine RPC (not yet implemented)
        └── server enforces: status=pending on INSERT, customerActorId from auth.uid()
```

## TODO

- [ ] Confirm createBooking.controller.js line 138 notification linkPath construction
- [ ] Confirm which RPC is targeted in TICKET-BOOKING-RPC-001
