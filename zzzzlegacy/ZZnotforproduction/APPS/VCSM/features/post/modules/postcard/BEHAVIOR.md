---
title: Postcard Module — Behavior
status: STUB
feature: post
module: postcard
source: venom+bw-derived
created: 2026-06-05
---

# post / modules / postcard — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder (VEN-POST-007 THOR BLOCKER).

## Expected Behaviors (UNVERIFIED)

- Actor views post detail screen with media carousel, reactions, comments
- Actor toggles binary reaction (like/dislike) — no self-reaction guard (BW-POST-004 BYPASSED)
- Actor sends rose with qty — no self-gifting guard, no qty cap (BW-POST-005 BYPASSED)
- Actor shares post via ShareModal
- Actor edits own post — editPost.controller + replacePostMentions (race gap on delete)
- Actor deletes own post — deletePost.controller
- Post notification linkPaths use raw UUID (/post/:id) (BW-POST-010 BYPASSED)

## Invariants (UNVERIFIED)

- Actor cannot react to own post (NOT enforced — BW-POST-004 BYPASSED)
- Actor cannot gift rose to own post (NOT enforced — BW-POST-005 BYPASSED)
- Edit must be scoped to owned posts only
- Soft-deleted posts must not be editable (NOT enforced — BW-POST-009 PARTIAL)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Confirm ownership gate on edit/delete paths
