---
title: Reviews Module — Behavior
status: STUB
feature: reviews
module: reviews
source: venom+bw-derived
created: 2026-06-05
---

# reviews / modules / reviews — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder (VEN-REVIEWS-002 THOR BLOCKER).

## Feature-Layer Behavior

- setup.js configures reviews engine wiring on app boot

## Engine-Layer Behaviors (UNVERIFIED — trace to engines/reviews)

- Create review via upsert_neutral_review SECURITY DEFINER RPC
- Orphaned dalInsertReview bypasses RPC (VEN-REVIEWS-001 THOR BLOCKER)
- Delete dimension ratings: no author_actor_id ownership guard
- getMyActiveReview: authorActorId not session-verified

## TODO

- [ ] Confirm engine/reviews module split
