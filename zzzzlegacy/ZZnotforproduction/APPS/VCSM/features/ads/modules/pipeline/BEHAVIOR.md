---
title: Pipeline Module — Behavior
status: STUB
feature: ads
module: pipeline
source: architect-derived
created: 2026-06-05
---

# ads / modules / pipeline — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review. Full behavior trace pending source read.

## Confirmed Behaviors

### Save Draft
- Caller creates ad payload via createAdDraft (model layer)
- adPipeline.usecase.js → saveDraftUseCase — validates via ad.validation.js, then calls ad.storage.dal.js upsertAd
- Writes to localStorage key vc.ads.pipeline.v1
- No server call

### Delete Ad
- adPipeline.usecase.js → deleteAdUseCase — accepts ad id, calls ad.storage.dal.js removeAd
- SECURITY GAP: no actorId ownership pre-check — any caller can delete any ad id in localStorage (VEN-ADS-004)

### Publish Ad
- adPipeline.usecase.js → publishAdUseCase — state transition (draft → published)
- UNVERIFIED: destination of published ad (localStorage status flag only? server API call?)

### Read Ad List
- ad.storage.dal.js listAdsByActor — reads from localStorage key vc.ads.pipeline.v1
- SECURITY GAP: storage key is global, not per-actorId; all actors on same device share same key (VEN-ADS-003)

## Pre-Migration State

All persistence is localStorage-only. No Supabase tables exist for ads. On migration:
- All above HIGH findings escalate to CRITICAL
- Ownership checks must be enforced at RPC/RLS layer
- Per-actorId namespace must be enforced in DAL or via Supabase row ownership

## TODO

- [ ] Confirm publishAdUseCase destination — localStorage flag or API call?
- [ ] Confirm localStorage format — array of ad objects? object keyed by id?
- [ ] Confirm validation rules in ad.validation.js
- [ ] Confirm whether createAdDraft accepts partial data or requires full payload
