---
title: Search Module — Architecture
status: STUB
feature: actors
module: search
source: architect-derived
created: 2026-06-05
---

# actors / modules / search — ARCHITECTURE

## Status

STUB. Architecture sourced from ARCHITECT 2026-06-04. 4-file module — minimal layer stack. Verification required.

## Layer Stack (unverified)

```
[Consuming feature] → actors.adapter.js (approved surface)
  └── searchActors.controller.js
        ├── [null viewerActorId guard — enforcement point]
        └── searchActors.dal.js
              └── identity.search_actor_directory RPC
                    params: p_query, p_filter ('public'|'all'), p_viewer_actor_id
                    returns: raw actor directory rows
        └── searchActors.model.js
              └── mapSearchActorsRows (array) → mapSearchActorRow (single)
  → typed ActorSearchResult[]
```

## Source File Map

| File | Layer | Confirmed |
|---|---|---|
| adapters/actors.adapter.js | Adapter (public surface) | ARCHITECT-derived |
| controllers/searchActors.controller.js | Controller | ARCHITECT-derived |
| dal/searchActors.dal.js | DAL (RPC read) | ARCHITECT-derived |
| model/searchActors.model.js | Model (row mapper) | ARCHITECT-derived |

## RPC Contract

| RPC | Schema | Type | Auth Requirement |
|---|---|---|---|
| search_actor_directory | identity | READ (returns rows) | None required — but null viewerActorId restricts to public only |

## Security Architecture Note

The null-viewer guard is the canonical protection mechanism. The RPC itself enforces `p_filter='public'` when viewer is null via DB function logic. The app layer (controller/DAL) must not override this by hardcoding `p_filter='all'`. Three cross-feature callers currently bypass this (VEN-ACTORS-003).

## Module Boundaries

- All consuming features must import via actors.adapter.js only
- No hooks or screens — this is a pure service layer
- No React Query involvement — callers own their own caching strategy

## TODO

- [ ] Read searchActors.controller.js — confirm exact guard logic for viewerActorId
- [ ] Read searchActors.dal.js — confirm RPC parameter names and truthy-only check (ELEK-2026-06-04-006)
- [ ] Read searchActors.model.js — confirm mapSearchActorRow output shape
- [ ] Read actors.adapter.js — confirm which functions are exported
