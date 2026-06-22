---
title: Visibility Module — Behavior
status: STUB
feature: moderation
module: visibility
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / visibility — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder (BW-MOD-009 THOR BLOCKER).

## Expected Behaviors (UNVERIFIED)

### Personal Hide (Actor-Scoped)
- Actor can hide a post or message from their own view
- Stored in moderation.actions (actor-scoped)
- actor_id supplied by caller — no session binding verified
- Vport actors not excluded (BW-MOD-005 BYPASSED)

### Moderator Actions (Global-Scoped)
- Moderator can hide or unhide reported content globally
- assertModerationAccess gate required before any action
- hidePostRow and hideMessageRow: DAL functions with no own auth guard
- Status update: no allowlist, no terminal-state guard

### Visibility Reads
- usePostVisibility / useCommentVisibility drive UI rendering
- Hidden content replaced by ReportedObjectCover or ReportCoverScreen

## TODO

- [ ] Define invariant: moderator gate must fire before any hide/unhide
- [ ] Confirm actor kind check on personal hide path
- [ ] Confirm dismissed report terminal state behavior
