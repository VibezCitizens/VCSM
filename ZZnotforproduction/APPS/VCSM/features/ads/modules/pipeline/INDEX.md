---
title: Pipeline Module — Index
status: STUB
feature: ads
module: pipeline
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/ads/
scanner-version: 1.1.0
---

# ads / modules / pipeline

Core data and logic layer for the ads feature. Owns the use case orchestration, localStorage persistence, validation, and model transformation. All persistence is via localStorage — no Supabase writes. Security findings escalate to CRITICAL when ads migrates to Supabase backend.

## Module Summary

| Field | Value |
|---|---|
| Module | pipeline |
| Feature | ads |
| Source Path | apps/VCSM/src/features/ads/ |
| Screens | 0 |
| Routes | 0 |
| Persistence | localStorage (vc.ads.pipeline.v1) — NO Supabase writes |
| Use Cases | 1 (adPipeline.usecase.js) |
| DAL Files | 1 |
| API Files | 1 |
| Models | 1 |
| Validation | 1 |
| Pre-migration THOR risk | HIGH — VEN-ADS-001, VEN-ADS-002, VEN-ADS-004 escalate to CRITICAL on Supabase migration |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| usecases/adPipeline.usecase.js | Use case | Orchestration — saveDraftUseCase, deleteAdUseCase, publishAdUseCase |
| dal/ad.storage.dal.js | DAL | localStorage CRUD — listAdsByActor, upsertAd, removeAd |
| api/ad.api.js | API shim | Thin wrapper over DAL |
| model/ad.model.js | Model | createAdDraft, normalizeAd |
| lib/ad.validation.js | Validation | Ad payload validation |
| constants.js | Constants | ADS_STORAGE_KEY = 'vc.ads.pipeline.v1' |
| ads.feature.js | Barrel | Exports usecases directly — bypasses adapter boundary (VEN-ADS-005) |

## Persistence

localStorage key: `vc.ads.pipeline.v1`
Operations: listAdsByActor (read), upsertAd (write), removeAd (delete)

No Supabase tables, no RPCs, no edge functions.

## Security Flags

- HIGH (pre-migration CRITICAL): VEN-ADS-004 — deleteAdUseCase accepts bare id with no actorId ownership pre-check
- HIGH: VEN-ADS-005 — ads.feature.js barrel exports usecases directly, bypassing adapter boundary
- MEDIUM: VEN-ADS-003 — localStorage keyed on global ADS_STORAGE_KEY with no per-actorId namespace; cross-actor data co-mingles in multi-identity sessions
- LOW: BW-ADS-005 — null actorId draft saved to localStorage; deleteAdUseCase(undefined) is silent no-op
- LOW: BW-ADS-006 — no state-machine enforcement; archived/paused ads can be re-published without restriction

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm adPipeline.usecase.js exports (saveDraft, deleteAd, publishAd — any others?)
- [ ] Confirm localStorage storage format — is it a map keyed by actorId or a flat array?
- [ ] Confirm ad.validation.js validation rules (required fields, format constraints)
- [ ] Flag for pre-migration gate: all HIGH findings become CRITICAL on Supabase migration
