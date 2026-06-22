---
title: Availability Module — Index
status: STUB
feature: booking
module: availability
source: architect+venom+elektra+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/booking/
scanner-version: 1.1.0
---

# booking / modules / availability

Availability rule and exception management. **THOR BLOCKERS: onConflict:id cross-actor hijack on both upsert surfaces.** Slot computation and calendar model assembly.

## Module Summary

| Field | Value |
|---|---|
| Module | availability |
| Feature | booking |
| Source Path | apps/VCSM/src/features/booking/ |
| Screens | 0 |
| Write Surfaces | availability_rules UPSERT, availability_exceptions UPSERT |
| Controllers | 3 (setAvailabilityRule, setAvailabilityException, getResourceAvailability) |
| DAL Files | 3 (upsertAvailabilityRule, upsertAvailabilityException, listAvailabilityRulesByResourceId, listAvailabilityExceptionsInRange) |
| Hooks | 2 (useManageAvailability, useBookingAvailability) |
| Models | 4 (bookingAvailability, bookingCalendarAvailability, bookingCalendarDate, buildSlots) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| controller/setAvailabilityRule.controller.js | Controller | Upsert availability rule (ownership-gated) |
| controller/setAvailabilityException.controller.js | Controller | Upsert availability exception (ownership-gated) |
| controller/getResourceAvailability.controller.js | Controller | Read availability for resource |
| dal/upsertAvailabilityRule.dal.js | DAL | availability_rules UPSERT onConflict:id (THOR BLOCKER) |
| dal/upsertAvailabilityException.dal.js | DAL | availability_exceptions UPSERT onConflict:id (THOR BLOCKER) |
| dal/listAvailabilityRulesByResourceId.dal.js | DAL | Rules read |
| dal/listAvailabilityExceptionsInRange.dal.js | DAL | Exceptions read |
| hooks/useManageAvailability.js | Hook | Availability write mutations |
| hooks/useBookingAvailability.js | Hook | Availability read query |
| model/bookingAvailability.model.js | Model | Availability state shape |
| model/bookingCalendarAvailability.model.js | Model | Calendar availability view |
| model/bookingCalendarDate.model.js | Model | Calendar date normalization |
| model/buildSlots.model.js | Model | Slot computation from rules |

## Write Surface Map

| Operation | Table | Conflict Key | Risk |
|---|---|---|---|
| UPSERT | availability_rules | onConflict:id | THOR BLOCKER — cross-actor ruleId hijack |
| UPSERT | availability_exceptions | onConflict:id | THOR BLOCKER — cross-actor exceptionId hijack |

## Security Flags

- **THOR BLOCKER** HIGH: ELEK-2026-06-04-001 / BW-BOOK-009 — upsertAvailabilityRuleDAL onConflict:id allows overwrite of foreign rule row; controller verifies resourceId ownership but NOT ruleId ownership; attacker with known foreign ruleId can overwrite victim rule via their own resourceId
- **THOR BLOCKER** HIGH: ELEK-2026-06-04-002 / BW-BOOK-010 — same onConflict:id hijack vector on upsertAvailabilityExceptionDAL

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Fix upsertAvailabilityRuleDAL: add onConflict constraint to include resource_id scope, or verify ruleId ownership before upsert
- [ ] Fix upsertAvailabilityExceptionDAL: same fix
- [ ] Confirm controller-layer ownership check — which function is called, and does it check ruleId/exceptionId?
