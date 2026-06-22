---
title: Availability Module — Architecture
status: STUB
feature: booking
module: availability
source: architect-derived
created: 2026-06-05
---

# booking / modules / availability — ARCHITECTURE

## Write Layer Stack

```
[dashboard consumer]
  └── booking.adapter.js
        └── useManageAvailability.js
              ├── setAvailabilityRule.controller.js
              │     ├── assertActorOwnsVportActor (resource ownership check)
              │     └── upsertAvailabilityRuleDAL
              │           .upsert({ ... }, { onConflict: 'id' })  ← THOR BLOCKER: no resource_id scope
              │
              └── setAvailabilityException.controller.js
                    ├── assertActorOwnsVportActor (resource ownership check)
                    └── upsertAvailabilityExceptionDAL
                          .upsert({ ... }, { onConflict: 'id' })  ← THOR BLOCKER: no resource_id scope
```

## Read + Slot Computation

```
useBookingAvailability.js
  └── getResourceAvailability.controller.js
        ├── listAvailabilityRulesByResourceId.dal (rules read)
        ├── listAvailabilityExceptionsInRange.dal (exceptions read)
        └── buildSlots.model (compute available slots)
```

## Attack Vector (THOR BLOCKER)

```
Attacker owns resourceId=R1 (legitimate).
Target owns ruleId=X on resourceId=R2 (foreign).
Attacker calls setAvailabilityRule({ ruleId: X, resourceId: R1, ... })
  → controller checks: does attacker own R1? YES.
  → upsertAvailabilityRuleDAL upserts onConflict:'id' (ruleId=X)
  → overwrites victim's rule on R2.
```

Fix: use onConflict:'resource_id,id' or verify ruleId belongs to resourceId before upsert.

## TODO

- [ ] Confirm upsertAvailabilityRuleDAL onConflict clause exact column
- [ ] Confirm upsertAvailabilityExceptionDAL onConflict clause exact column
- [ ] Confirm DB unique constraint on (resource_id, id) exists for both tables
