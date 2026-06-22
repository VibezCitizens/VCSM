---
title: Briefings Module — Behavior
status: STUB
feature: professional
module: briefings
source: venom+bw-derived
created: 2026-06-05
---

# professional / modules / briefings — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder (VEN-PROFESSIONAL-001 THOR BLOCKER).

## Expected Behaviors (UNVERIFIED)

- Authenticated professional views compliance briefings from vc.notifications
- Actor marks briefings seen via dalMarkProfessionalBriefingsSeen
- linkPath from notification navigated on item tap (unsanitized — redirect risk)
- Mark-seen is not idempotent at controller/DAL layer

## Invariants (UNVERIFIED)

- Read must be scoped to authenticated actor's own notifications (NOT confirmed — BW-PROF-003 UNRESOLVED)
- Mark-seen must be scoped to authenticated actor (NOT confirmed — VEN-PROFESSIONAL-002)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Confirm vc.notifications SELECT RLS policy
