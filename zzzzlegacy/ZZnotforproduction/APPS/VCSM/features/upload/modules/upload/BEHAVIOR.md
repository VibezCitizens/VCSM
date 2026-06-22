---
title: Upload Module — Behavior
status: STUB
feature: upload
module: upload
source: venom+bw-derived
created: 2026-06-05
---

# upload / modules / upload — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder (VEN-UPLOAD-011 / BW-UPLOAD-005 THOR BLOCKER).

## Expected Behaviors (UNVERIFIED)

- Actor creates a post with media (images/video) and optional mentions
- createPostController inserts post — actor identity from identityContext (no actor_owners DB verify)
- recordPostMedia stores media records — may pass null actorId (BW-UPLOAD-002)
- post_type set from input.mode without allowlist validation (VEN-UPLOAD-009 BYPASSED)
- On rollback: deletePostByIdDAL — no ownership predicate (VEN-UPLOAD-005 BYPASSED)
- createSystemPost: actorId from caller without actor_owners verify (VEN-UPLOAD-007 BYPASSED)
- Mention autocomplete: searchMentionSuggestions passes null viewerActorId (VEN-UPLOAD-006)

## Invariants (UNVERIFIED)

- Post creator must own the actor identity used (NOT confirmed — BW-UPLOAD-001 PARTIAL)
- post_type must be from allowlist (NOT enforced — VEN-UPLOAD-009 BYPASSED)
- Notification linkPath must not contain raw UUIDs (NOT enforced — VEN-UPLOAD-010 BYPASSED)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Confirm actor_owners DB check for post create
