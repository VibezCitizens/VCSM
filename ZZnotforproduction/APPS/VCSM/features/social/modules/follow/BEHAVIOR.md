---
title: Follow Module — Behavior
status: STUB
feature: social
module: follow
source: venom+bw-derived
created: 2026-06-05
---

# social / modules / follow — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder.

## Expected Behaviors (UNVERIFIED)

- Actor follows/subscribes to another actor — dalInsertFollow
- Actor unfollows — dalDeactivateFollow (no precondition on is_active)
- Actor sends follow request to private actor — ctrlSendFollowRequest (no assertingActorId gate — BYPASSED)
- Actor accepts/rejects incoming follow request — ctrlListIncomingRequests

## Invariants (UNVERIFIED)

- Follow insert must be scoped to authenticated actor (NOT confirmed — BW-SOCIAL-006 UNRESOLVED)
- Follow request must be sent by authenticated actor (NOT enforced — BW-SOCIAL-001 BYPASSED)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Confirm RLS on vc.actor_follows
