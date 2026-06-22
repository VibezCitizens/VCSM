---
title: Ownership Module — Behavior
status: STUB
feature: booking
module: ownership
source: architect-derived
created: 2026-06-05
---

# booking / modules / ownership — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Assert Actor Owns VPORT Actor
- Called before any management-source booking operation
- assertActorOwnsVportActor.controller reads actor_owners table via readActorOwnerLinkByActorAndUserProfile.dal
- Throws if actor does not own the target VPORT actor
- Guards: null requestActorId (rejected), wrong actorKind (rejected), stale session (rejected via live DB lookup)
- All guard paths verified by 17 test assertions

### Resolve VPORT Profile ID
- resolveVportProfileId.controller → getVportProfileIdByActorId.dal
- Returns the profileId associated with a VPORT actor

### VPORT Slug Resolution
- getVportSlugByActorId.dal — returns human-readable slug for a VPORT actor
- Used in notification linkPath construction (slug, not UUID)

### QR Link Generation
- useQrLinks.js — generates QR booking links using VPORT slug (not raw actorId)

## Critical Invariant

assertActorOwnsVportActor.controller is the sole security gate for all management operations. Any change requires:
1. Full 17-assertion test re-run
2. VENOM re-scan of booking feature
3. THOR gate re-evaluation

## TODO

- [ ] Confirm all 17 test assertions cover: null actor, wrong kind, stale session, non-owner, correct owner
- [ ] Confirm getVportSlugByActorId returns slug and not UUID in all code paths
