---
title: Services Module — Architecture
status: STUB
feature: booking
module: services
source: architect-derived
created: 2026-06-05
---

# booking / modules / services — ARCHITECTURE

## Layer Stack

```
[booking flow / profiles consumer]
  └── booking.adapter.js
        ├── useBookingServices.js
        │     └── bookingServices.controller.js
        │           └── readVportServicesByActor.dal.js → services read
        │
        ├── useBookingServiceProfiles.js
        │     └── getBookingServiceProfiles.controller.js
        │           └── listBookingServiceProfilesByServiceIds.dal.js → profiles read
        │
        └── useResourceServiceOverrides.js
              └── listBookingResourceServicesByResourceId.dal.js → resource overrides read
```

## TODO

- [ ] Confirm readVportServicesByActor.dal.js actorId filter
- [ ] Confirm listBookingServiceProfilesByServiceIds.dal.js serviceIds scope
