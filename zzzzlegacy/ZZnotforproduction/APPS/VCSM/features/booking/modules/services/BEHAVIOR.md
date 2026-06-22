---
title: Services Module — Behavior
status: STUB
feature: booking
module: services
source: architect-derived
created: 2026-06-05
---

# booking / modules / services — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Load Bookable Services
- Booking UI loads available services for a VPORT via useBookingServices
- bookingServices.controller → readVportServicesByActor.dal → returns services for actor

### Load Service Profiles
- Booking flow reads service duration profiles via useBookingServiceProfiles
- getBookingServiceProfiles.controller → listBookingServiceProfilesByServiceIds.dal
- Profiles drive slot duration computation in availability module

### Resource Service Overrides
- Owner may have per-resource service duration overrides
- useResourceServiceOverrides → listBookingResourceServicesByResourceId.dal
- Overrides feed into slot computation

## Note

All write paths for this module (service profile duration configuration) are in the resources module's dead DALs. Until those are fixed, service profile writes are non-functional.

## TODO

- [ ] Confirm readVportServicesByActor.dal.js is scoped to requesting actor's services only
- [ ] Confirm service profile reads use serviceIds validated against the requesting actor
