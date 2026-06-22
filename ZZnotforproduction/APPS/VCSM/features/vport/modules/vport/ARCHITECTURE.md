---
title: Vport Module — Architecture
status: STUB
feature: vport
module: vport
source: venom+bw-derived
created: 2026-06-05
---

# vport / modules / vport — ARCHITECTURE

## Update VPORT Path

```
vportCoreOps.controller.js (zero-logic DAL bridge) ← VEN-VPORT-007
  └── vport.core.dal.js → updateVport → vport.profiles UPDATE
        ├── .eq('id', vportId) ONLY — no owner_user_id filter ← VEN-VPORT-002 / BW-VPORT-001
        └── RLS sole ownership barrier (CONDITIONAL BLOCKER if RLS absent)
```

## Media Asset Update Path

```
updateVportAvatarMediaAssetIdDAL / updateVportBannerMediaAssetIdDAL
  └── vport.profiles UPDATE
        ├── No session auth guard ← VEN-VPORT-004 / BW-VPORT-002
        └── RLS sole ownership barrier (CONDITIONAL BLOCKER if RLS absent)
```

## Soft Delete / Restore Path

```
ctrlSoftDeleteVport / ctrlRestoreVport
  └── No app-layer ownership check ← VEN-VPORT-003
        └── soft_delete_vport / restore_vport RPC
              └── RPC ownership enforcement UNVERIFIED
```

## Public Data Leak

```
getVportById / getVportBySlug SELECT
  └── owner_user_id (Supabase auth UUID) included in columns ← VEN-VPORT-006
```

## Migration Barrel

```
vport.public.js → exports ownership-unsafe updateVport ← VEN-VPORT-005
  └── No removal deadline documented
```

## TODO

- [ ] Run /DB to verify vport.profiles RLS UPDATE policy
- [ ] Confirm RPC soft_delete_vport / restore_vport ownership enforcement
