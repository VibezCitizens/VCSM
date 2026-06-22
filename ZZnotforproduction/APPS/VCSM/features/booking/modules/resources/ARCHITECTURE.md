---
title: Resources Module — Architecture
status: STUB
feature: booking
module: resources
source: architect-derived
created: 2026-06-05
---

# booking / modules / resources — ARCHITECTURE

## Active Paths

```
useAddStaffResource.js / useLocationResources.js
  └── ensureOwnerBookingResource.controller.js
        ├── assertActorOwnsVportActor (ownership gate)
        └── insertBookingResource.dal.js → resources INSERT

useOwnerBookingResources.js
  └── listOwnerBookingResources.controller.js  ← NO AUTH ASSERTION
        └── listBookingResourcesByOwnerActorId.dal.js
```

## Dead Paths (CRITICAL)

```
setResourceSlotDuration.controller.js
  └── saveBookingServiceProfileDurationsByServiceIds.dal.js
        ├── line 38: supabase.from(...)  ← ReferenceError: supabase is not defined
        ├── line 53: supabase.from(...)  ← same
        └── line 79: supabase.from(...)  ← same
        → All writes silently fail

[resource-service link path]
  └── upsertBookingResourceServices.dal.js
        └── line 24: supabase.from(...)  ← ReferenceError: supabase is not defined
        → All writes silently fail
```

Both dead DALs appear to be missing the supabase client import. Other DALs in the feature use either `vcClient` or `supabaseClient` — the correct client must be identified and imported.

## TODO

- [ ] Identify correct supabase client for these DALs (check nearby DALs for import pattern)
- [ ] Add client import to both dead DALs
- [ ] Add auth assertion to listOwnerBookingResourcesController
