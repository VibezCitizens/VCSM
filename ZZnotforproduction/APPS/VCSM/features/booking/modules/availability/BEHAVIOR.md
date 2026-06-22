---
title: Availability Module — Behavior
status: STUB
feature: booking
module: availability
source: architect-derived
created: 2026-06-05
---

# booking / modules / availability — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Set Availability Rule
- Owner sets recurring availability (hours, days) via useManageAvailability
- setAvailabilityRule.controller verifies ownership via assertActorOwnsVportActor
- Calls upsertAvailabilityRuleDAL — SECURITY GAP: onConflict:id does not scope to resource_id
- Any known foreign ruleId can be overwritten via a malicious resourceId combination

### Set Availability Exception
- Owner sets a one-off exception (closed day, holiday) via useManageAvailability
- setAvailabilityException.controller verifies resource ownership
- Calls upsertAvailabilityExceptionDAL — same onConflict:id hijack vector

### Read Availability
- Customer or owner reads available slots for a resource via useBookingAvailability
- getResourceAvailability.controller → reads rules and exceptions → buildSlots.model computes slots

### Slot Computation
- buildSlots.model: takes rules + exceptions → returns available time slots
- No write surfaces in slot computation

## Critical Invariants (CURRENTLY VIOLATED)

1. Availability rule upsert must scope conflict resolution to (resource_id, id) not just id
2. Availability exception upsert must scope conflict resolution to (resource_id, id) not just id

## TODO

- [ ] Confirm upsertAvailabilityRuleDAL onConflict clause — exact column(s) specified
- [ ] Confirm upsertAvailabilityExceptionDAL onConflict clause — same
- [ ] Confirm setAvailabilityRule.controller — does it check ruleId ownership before upsert?
