---
title: Vport Module — Behavior
status: STUB
feature: vport
module: vport
source: venom+bw-derived
created: 2026-06-05
---

# vport / modules / vport — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder (VEN-VPORT-008 THOR BLOCKER).

## Expected Behaviors (UNVERIFIED)

- Actor creates a VPORT (slug generated client-side — squatting risk)
- Actor updates VPORT profile — no app-layer owner_user_id guard (BW-VPORT-001 BYPASSED app layer)
- Actor updates avatar/banner media asset — no session auth guard (BW-VPORT-002 BYPASSED app layer)
- Actor soft-deletes VPORT — no app-layer ownership check (VEN-VPORT-003)
- Actor restores VPORT — no app-layer ownership check (VEN-VPORT-003)
- Fuel price submission: no session check (BW-VPORT-003 PARTIAL)

## Invariants (UNVERIFIED)

- VPORT update must be scoped to owner (NOT app-layer enforced — RLS sole barrier)
- Soft delete / restore must verify ownership (NOT app-layer enforced)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Run DB command to confirm vport.profiles RLS UPDATE policy
