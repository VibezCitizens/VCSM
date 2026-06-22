---
title: Resources Module — Index
status: STUB
feature: booking
module: resources
source: architect+venom+elektra+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/booking/
scanner-version: 1.1.0
---

# booking / modules / resources

Booking resource management (staff, chairs, locations). **CRITICAL: Two DALs are completely non-functional — undefined `supabase` variable.** Resource enumeration has no auth assertion.

## Module Summary

| Field | Value |
|---|---|
| Module | resources |
| Feature | booking |
| Source Path | apps/VCSM/src/features/booking/ |
| Screens | 0 |
| Write Surfaces | resources INSERT, resource_services UPSERT (DEAD), service_booking_profiles UPSERT (DEAD) |
| Controllers | 3 (ensureOwnerBookingResource, listOwnerBookingResources, setResourceSlotDuration) |
| DAL Files | 5 (insertBookingResource, listBookingResourcesByOwnerActorId, getBookingResourceById, upsertBookingResourceServices DEAD, saveBookingServiceProfileDurationsByServiceIds DEAD) |
| Hooks | 4 (useOwnerBookingResources, useAddStaffResource, useLocationResources, useOrganizationLocations) |
| Models | 1 (bookingResource) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role | Status |
|---|---|---|---|
| controller/ensureOwnerBookingResource.controller.js | Controller | Resource creation with ownership gate | ACTIVE |
| controller/listOwnerBookingResources.controller.js | Controller | Owner resource list — NO auth assertion | SECURITY GAP |
| controller/setResourceSlotDuration.controller.js | Controller | Slot duration configuration | ACTIVE |
| dal/insertBookingResource.dal.js | DAL | resources INSERT | ACTIVE |
| dal/listBookingResourcesByOwnerActorId.dal.js | DAL | Resources read | ACTIVE |
| dal/getBookingResourceById.dal.js | DAL | Single resource read | ACTIVE |
| dal/upsertBookingResourceServices.dal.js | DAL | resource_services UPSERT | **DEAD — undefined supabase** |
| dal/saveBookingServiceProfileDurationsByServiceIds.dal.js | DAL | service_booking_profiles UPSERT | **DEAD — undefined supabase** |
| hooks/useOwnerBookingResources.js | Hook | Owner resource list query | ACTIVE |
| hooks/useAddStaffResource.js | Hook | Add staff resource mutation | ACTIVE |
| hooks/useLocationResources.js | Hook | Location resources query | ACTIVE |
| hooks/useOrganizationLocations.js | Hook | Organization locations query | ACTIVE |
| model/bookingResource.model.js | Model | Resource shape | ACTIVE |

## Write Surface Map

| Operation | Table | Status | Risk |
|---|---|---|---|
| INSERT | resources | ACTIVE | ownership gate required |
| UPSERT | resource_services | **DEAD** | VEN-BOOKING-003 — feature silently broken |
| UPSERT | service_booking_profiles | **DEAD** | VEN-BOOKING-002 — slot config silently broken |

## Security Flags

- **THOR BLOCKER** CRITICAL: VEN-BOOKING-002 / ELEK-2026-06-04-006 — saveBookingServiceProfileDurationsByServiceIds.dal.js references undefined `supabase` variable at lines 38, 53, 79; slot configuration is completely non-functional; feature silently broken
- **THOR BLOCKER** CRITICAL: VEN-BOOKING-003 / ELEK-2026-06-04-007 — upsertBookingResourceServices.dal.js references undefined `supabase` variable at line 24; resource-service linking is completely non-functional
- MEDIUM: ELEK-2026-06-04-010 / BW-BOOK-007 — listOwnerBookingResourcesController has no caller auth assertion; any actor can enumerate foreign actors' booking resources

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Fix upsertBookingResourceServices.dal.js — import or reference correct supabase client
- [ ] Fix saveBookingServiceProfileDurationsByServiceIds.dal.js — same fix
- [ ] Add caller auth assertion to listOwnerBookingResourcesController
- [ ] Confirm which supabase client should be used (vcClient? supabaseClient?)
