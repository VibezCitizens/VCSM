# INDEX — ENGINES / booking

Status: ARCHITECT COMPLETE (2026-06-05)
Ticket: TICKET-ARCHITECT-MISSING-0001

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/booking/`

## Governance Files

| File | Status |
|------|--------|
| ARCHITECTURE.md | PRESENT |
| CURRENT_STATUS.md | PRESENT |
| BEHAVIOR.md | MISSING |
| SECURITY.md | MISSING |

## Source Inventory (as of 2026-06-05)

```
engines/booking/
├── index.js                          — entry point → adapters
├── CLAUDE.md                         — engine rules
├── src/
│   ├── config.js                     — DI + freeze guard
│   ├── events.js                     — BOOKING_EVENTS
│   ├── types/index.js                — JSDoc domain types
│   ├── dal/                          (14 files)
│   │   ├── actor.read.dal.js
│   │   ├── availability.read.dal.js
│   │   ├── availability.write.dal.js
│   │   ├── booking.read.dal.js
│   │   ├── booking.write.dal.js
│   │   ├── location.read.dal.js
│   │   ├── location.write.dal.js
│   │   ├── organization.read.dal.js
│   │   ├── organization.write.dal.js
│   │   ├── qrLink.read.dal.js
│   │   ├── qrLink.write.dal.js
│   │   ├── resource.read.dal.js
│   │   ├── resource.write.dal.js
│   │   ├── resourceServiceOverride.read.dal.js
│   │   ├── resourceServiceOverride.write.dal.js
│   │   ├── serviceProfile.read.dal.js
│   │   ├── serviceProfile.write.dal.js
│   │   ├── vportAvailability.read.dal.js
│   │   ├── vportAvailability.write.dal.js
│   │   ├── vportBooking.read.dal.js
│   │   ├── vportBooking.write.dal.js
│   │   ├── vportResource.read.dal.js
│   │   └── vportResource.write.dal.js
│   ├── model/                        (9 files)
│   │   ├── Booking.model.js
│   │   ├── BookingAvailability.model.js
│   │   ├── BookingResource.model.js
│   │   ├── BookingServiceProfile.model.js
│   │   ├── Location.model.js
│   │   ├── Organization.model.js
│   │   ├── QrLink.model.js
│   │   ├── ResourceServiceOverride.model.js
│   │   └── VportResource.model.js
│   ├── controller/                   (31 files + 3 test files)
│   │   ├── __tests__/
│   │   │   ├── assertActorCanManageResource.controller.test.js
│   │   │   ├── cancelBooking.controller.test.js
│   │   │   └── createBooking.controller.test.js
│   │   ├── assertActorCanManageLocation.controller.js
│   │   ├── assertActorCanManageOrganization.controller.js
│   │   ├── assertActorCanManageResource.controller.js
│   │   ├── assertActorOwnsVportActor.controller.js
│   │   ├── cancelBooking.controller.js
│   │   ├── completeBooking.controller.js
│   │   ├── confirmBooking.controller.js
│   │   ├── createBooking.controller.js
│   │   ├── createLocationResource.controller.js
│   │   ├── createOrganizationLocationWorkspace.controller.js
│   │   ├── createQrLink.controller.js
│   │   ├── dismissBooking.controller.js
│   │   ├── ensureOwnerBookingResource.controller.js
│   │   ├── getBookingServiceProfiles.controller.js
│   │   ├── getLocationAvailability.controller.js
│   │   ├── getResourceAvailability.controller.js
│   │   ├── listBookingHistory.controller.js
│   │   ├── listBookingResourcesByLocation.controller.js
│   │   ├── listLocationsByOrganization.controller.js
│   │   ├── listOrganizationsByOwnerActor.controller.js
│   │   ├── listOwnerBookingResources.controller.js
│   │   ├── listQrLinks.controller.js
│   │   ├── listResourceServiceOverrides.controller.js
│   │   ├── markNoShow.controller.js
│   │   ├── resolveBookingContext.controller.js
│   │   ├── resolveQrScan.controller.js
│   │   ├── setAvailabilityException.controller.js
│   │   ├── setAvailabilityRule.controller.js
│   │   ├── setResourceSlotDuration.controller.js
│   │   └── upsertResourceServiceOverride.controller.js
│   └── adapters/
│       └── index.js                  — public API surface (57 exports)
```

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/engine.booking.architecture.md`
