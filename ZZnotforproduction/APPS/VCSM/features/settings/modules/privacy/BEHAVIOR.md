---
title: Privacy Module — Behavior
status: STUB
feature: settings
module: privacy
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / privacy — BEHAVIOR

## Status

STUB.

## Expected Behaviors (UNVERIFIED)

- Actor blocks another actor — blocks.dal passes client-supplied actorId as p_blocker_actor_id to moderation RPC
- Actor unblocks actor — same path
- Block/unblock uses string-equality callerActorId check, not assertActorOwnsVportActorController
- Actor sets privacy level — dalSetActorPrivacy upsert with caller-supplied actor_id

## Invariants (UNVERIFIED)

- Block action must be scoped to authenticated actor (partially enforced — RPC auth.uid() binding UNVERIFIABLE from source)
- Privacy upsert must be scoped to authenticated actor (NOT enforced at DAL — BW-SETTINGS-005 PARTIAL)

## TODO

- [ ] Confirm moderation RPC name for block/unblock
- [ ] Confirm privacy table target column
