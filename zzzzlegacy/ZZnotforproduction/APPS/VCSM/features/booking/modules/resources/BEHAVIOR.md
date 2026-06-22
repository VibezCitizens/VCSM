---
title: Resources Module — Behavior
status: STUB
feature: booking
module: resources
source: architect-derived
created: 2026-06-05
---

# booking / modules / resources — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Add Staff/Location Resource
- Owner adds a staff member or location as a bookable resource via useAddStaffResource / useLocationResources
- ensureOwnerBookingResource.controller verifies ownership, then insertBookingResourceDAL
- Resource created successfully

### List Owner Resources
- Owner views their bookable resources via useOwnerBookingResources
- listOwnerBookingResources.controller → listBookingResourcesByOwnerActorId.dal
- SECURITY GAP: listOwnerBookingResourcesController has no caller auth assertion — any actor can enumerate foreign resources

### Set Slot Duration (SILENTLY BROKEN)
- Owner configures slot duration for a service on a resource
- setResourceSlotDuration.controller → saveBookingServiceProfileDurationsByServiceIds.dal.js
- **DEAD DAL**: undefined `supabase` variable at lines 38, 53, 79 — all writes silently fail

### Link Services to Resource (SILENTLY BROKEN)
- Owner links services to a resource via resource management flow
- Calls upsertBookingResourceServices.dal.js
- **DEAD DAL**: undefined `supabase` variable at line 24 — all writes silently fail

## Critical State

**Slot duration configuration and resource-service linking are completely non-functional.** No write reaches the DB. Users see success UI but no data is saved. Must fix immediately.

## TODO

- [ ] Identify correct supabase client import for both dead DALs
- [ ] Confirm listOwnerBookingResourcesController caller identity source
- [ ] Add auth assertion to listOwnerBookingResourcesController
