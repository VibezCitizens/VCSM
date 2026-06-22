---
title: Ownership Module — Architecture
status: STUB
feature: booking
module: ownership
source: architect-derived
created: 2026-06-05
---

# booking / modules / ownership — ARCHITECTURE

## Layer Stack

```
[any management-source controller]
  └── assertActorOwnsVportActor.controller.js (security linchpin)
        ├── null requestActorId → THROW
        ├── wrong actorKind → THROW
        └── readActorOwnerLinkByActorAndUserProfile.dal.js
              → actor_owners table live DB lookup
              ├── no link found → THROW
              └── link found → PASS
```

## Profile ID Resolution

```
[booking creation / notification path]
  └── resolveVportProfileId.controller.js
        └── getVportProfileIdByActorId.dal.js → profileId
```

## Slug Resolution (notification linkPath)

```
[notification link construction]
  └── getVportSlugByActorId.dal.js → human-readable slug (not UUID)
```

## QR Links

```
useQrLinks.js
  └── uses VPORT slug + booking ID for QR link generation
```

## Test Coverage

assertActorOwnsVportActor.controller.test.js — 17 assertions (Vitest)

## TODO

- [ ] Confirm 17 assertion scope — document what each covers
- [ ] Confirm getVportSlugByActorId returns slug in all edge cases (no slug registered?)
