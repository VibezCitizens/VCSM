---
title: Pipeline Module — Architecture
status: STUB
feature: ads
module: pipeline
source: architect-derived
created: 2026-06-05
---

# ads / modules / pipeline — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review. Full trace pending.

## Layer Stack

```
Caller (settings module: useVportAds.js)
  └── ads.feature.js (barrel — bypasses adapter, VEN-ADS-005)
        └── adPipeline.usecase.js (orchestration)
              ├── ad.validation.js (validate payload)
              ├── ad.model.js (createAdDraft, normalizeAd)
              └── ad.storage.dal.js (localStorage CRUD)
                    └── localStorage.getItem/setItem (vc.ads.pipeline.v1)
```

## Correct Adapter Path (not currently enforced)

```
Caller
  └── [adapters/hooks/useVportAds.adapter.js]   ← should be entry point
        └── useVportAds.js
              └── adPipeline.usecase.js
```

VEN-ADS-005: ads.feature.js barrel exports usecases directly, bypassing the adapter boundary. External callers can call usecases without going through the adapter.

## Module Boundaries

| Boundary | Owner | Status |
|---|---|---|
| Entry: adapter public surface | adapters/hooks/useVportAds.adapter.js | BYPASSED via barrel |
| Orchestration | adPipeline.usecase.js | OK |
| Validation | ad.validation.js | OK |
| Model | ad.model.js | OK |
| Persistence | ad.storage.dal.js → localStorage | OK (pre-migration) |

## TODO

- [ ] Confirm ads.feature.js exports — exactly what usecases are exposed directly?
- [ ] Confirm which callers import from ads.feature.js vs adapter path
- [ ] Confirm ad.api.js role — is it a thin DAL wrapper or a separate API call layer?
- [ ] Trace full call graph for publishAdUseCase
