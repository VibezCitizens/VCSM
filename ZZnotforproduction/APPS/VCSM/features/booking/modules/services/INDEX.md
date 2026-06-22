---
title: Services Module — Index
status: STUB
feature: booking
module: services
source: architect+venom+elektra+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/booking/
scanner-version: 1.1.0
---

# booking / modules / services

Booking service profile reads and service-resource configuration. Read-heavy — no THOR blockers in this module. Dependent on DEAD DALs in resources module for write paths.

## Module Summary

| Field | Value |
|---|---|
| Module | services |
| Feature | booking |
| Source Path | apps/VCSM/src/features/booking/ |
| Screens | 0 |
| Write Surfaces | service_booking_profiles UPSERT (via resources module DEAD DAL) |
| Controllers | 2 (bookingServices, getBookingServiceProfiles) |
| DAL Files | 3 (listBookingServiceProfilesByServiceIds, listBookingResourceServicesByResourceId, readVportServicesByActor) |
| Hooks | 3 (useBookingServices, useBookingServiceProfiles, useResourceServiceOverrides) |
| Models | 1 (bookingServiceProfile) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| controller/bookingServices.controller.js | Controller | Service listing for booking flow |
| controller/getBookingServiceProfiles.controller.js | Controller | Service profile reads |
| dal/listBookingServiceProfilesByServiceIds.dal.js | DAL | Service profiles read |
| dal/listBookingResourceServicesByResourceId.dal.js | DAL | Resource services read |
| dal/readVportServicesByActor.dal.js | DAL | VPORT services read |
| hooks/useBookingServices.js | Hook | Service list query |
| hooks/useBookingServiceProfiles.js | Hook | Service profile query |
| hooks/useResourceServiceOverrides.js | Hook | Per-resource service override query |
| model/bookingServiceProfile.model.js | Model | Service profile shape |

## Write Surface Map

None in this module directly. Write path is in resources module (saveBookingServiceProfileDurationsByServiceIds — currently DEAD).

## Security Flags

- INFO: All DAL reads in this module — confirm service reads are scoped to the requesting actor's VPORT; unscoped reads could expose competitor services
- INFO: readVportServicesByActor.dal.js — confirm actorId filter is enforced; no cross-VPORT service enumeration

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm readVportServicesByActor.dal.js filter — actorId scoped?
- [ ] Confirm listBookingServiceProfilesByServiceIds — service IDs validated against requesting actor?
- [ ] Note: write path blocked until resources module DEAD DALs are fixed
