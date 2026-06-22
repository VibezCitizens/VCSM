---
title: Report Module — Behavior
status: STUB
feature: moderation
module: report
source: venom+bw-derived
created: 2026-06-05
---

# moderation / modules / report — BEHAVIOR

## Status

STUB. Parent feature BEHAVIOR.md is a placeholder — BW-MOD-009/VEN-MODERATION-007 THOR BLOCKER.

## Expected Behaviors (UNVERIFIED — derive from source)

- User opens report flow on a post, message, or actor (contextual trigger)
- User selects reason code from REPORT_REASONS list
- report.controller submits via reports.dal
- ReportThanksOverlay displayed on success
- Deduplication: dedupeKey supplied by caller (server-side not enforced)

## Known Invariants (UNVERIFIED)

- Reporter identity must be bound to authenticated session (UNCONFIRMED — BW-MOD-001 BYPASSED)
- Reason code must be in REPORT_REASONS allowlist (UNCONFIRMED — BW-MOD-004 BYPASSED)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Confirm reporterActorId source (session-derived vs prop-supplied)
- [ ] Document deduplication behavior
- [ ] Confirm report status lifecycle (pending → actioned → dismissed)
