---
title: Vports Module — Behavior
status: STUB
feature: settings
module: vports
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / vports — BEHAVIOR

## Status

STUB.

## Expected Behaviors (UNVERIFIED)

- Actor soft-deletes their VPORT from settings Vports tab
- Actor restores previously soft-deleted VPORT
- ctrlSoftDeleteVport and ctrlRestoreVport have no app-layer ownership gate
- useVportsController.restoreVport calls ctrlRestoreVport with no callerActorId (BYPASSED)

## Invariants (UNVERIFIED)

- Soft delete must verify actor owns the VPORT being deleted (NOT enforced — BW-SETTINGS-001 BYPASSED)
- Restore must verify actor owns the VPORT (NOT enforced — BW-SETTINGS-006 BYPASSED)

## TODO

- [ ] Confirm RPC name for soft delete / restore
- [ ] Confirm DAL-level ownership check status
