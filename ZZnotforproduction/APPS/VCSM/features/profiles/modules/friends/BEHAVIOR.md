---
title: Friends Module — Behavior
status: STUB
feature: profiles
module: friends
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / friends — BEHAVIOR

## Status

STUB.

## Expected Behaviors (UNVERIFIED)

- Actor views top friend candidates on profile
- Actor saves top friend ranks — stored in vc.actor_friend_ranks or similar
- ownerActorId derived from URL useParams(), not session identity
- useSaveTopFriendRanks hook accepts ownerActorId as external argument (no useIdentity() binding)

## Invariants (UNVERIFIED)

- Rank writes must be scoped to authenticated actor (NOT enforced — BW-PROF-001 BYPASSED)

## TODO

- [ ] Confirm target table for friendRanks.write.dal
- [ ] Confirm useSaveTopFriendRanks hook location
