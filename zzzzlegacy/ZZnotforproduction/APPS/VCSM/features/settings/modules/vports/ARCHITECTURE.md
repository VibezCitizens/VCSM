---
title: Vports Module — Architecture
status: STUB
feature: settings
module: vports
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / vports — ARCHITECTURE

## Soft Delete Path

```
[actor taps delete vport] → ctrlSoftDeleteVport
  ├── NO app-layer ownership gate ← VEN-SETTINGS-001 / BW-SETTINGS-001 BYPASSED
  └── vports/dal → soft-delete RPC
        └── RPC-level ownership (UNVERIFIED)
```

## Restore Path

```
useVportsController.restoreVport → ctrlRestoreVport
  ├── callerActorId MISSING on Vports tab path ← BW-SETTINGS-006 BYPASSED
  └── NO app-layer ownership gate ← VEN-SETTINGS-001
        └── vports/dal → restore RPC
```

## TODO

- [ ] Confirm RPC auth.uid() binding enforces VPORT ownership at DB level
