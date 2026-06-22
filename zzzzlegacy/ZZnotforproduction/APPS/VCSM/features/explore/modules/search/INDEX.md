---
title: Search Module — Index
status: STUB
feature: explore
module: search
source: architect+venom+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/explore/
scanner-version: 1.1.0
---

# explore / modules / search

Core search logic — use case orchestration, DAL, controllers, hooks, and model. **THOR BLOCKER: viewerActorId always null in primary search path — identity.search_actor_directory RPC never receives authenticated viewer context.**

## Module Summary

| Field | Value |
|---|---|
| Module | search |
| Feature | explore |
| Source Path | apps/VCSM/src/features/explore/ |
| Screens | 0 (screens in ui module) |
| Routes | 0 |
| Write Surfaces | None (identity.search_actor_directory RPC is read-only semantically) |
| Controllers | 2 (searchResults, searchTabs) |
| Use Cases | 1 (search.usecase.js) |
| DAL Files | 1 (search.dal.js — multi-function) |
| Hooks | 3 (useSearchScreenController, useSearchActor, useSearchTabsActor) |
| Models | 1 (search.model.js — 9 normalizer functions) |
| Cache | 45s staleTime in useSearchScreenController (module-level, not viewer-scoped) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| controller/searchResults.controller.js | Controller | Primary search — viewerActorId NEVER injected (THOR BLOCKER) |
| controller/searchTabs.controller.js | Controller | Tab-scoped search — viewerActorId from props (not session) |
| dal/search.dal.js | DAL | searchActors (identity RPC), searchPosts, searchPostsByTag, searchDal dispatcher |
| usecases/search.usecase.js | Use case | Search orchestration |
| hooks/useSearchScreenController.js | Hook | Primary view model; 45s cache |
| hooks/useSearchActor.js | Hook | Thin re-export shim (no formal adapter) |
| hooks/useSearchTabsActor.js | Hook | Tab-specific search hook |
| model/search.model.js | Model | normalizeActorRow, normalizeResult, dedupeByKindAndId, mapActorSearchResult (userId legacy), mapVportSearchResult (ownerUserId legacy), mapPostSearchResult, mapVideoSearchResult, mapGroupSearchResult, mapSearchResult |

## RPC Surface

| RPC | Direction | viewerActorId | Status |
|---|---|---|---|
| identity.search_actor_directory | READ | Always null in searchResults path | THOR BLOCKER |
| identity.search_actor_directory | READ | From props in searchTabs path | Partial — not session-derived |

## Security Flags

- **THOR BLOCKER** HIGH: VEN-EXPLORE-002 / BW-EXPLORE-001 — viewerActorId always null in ctrlSearchResults; search_actor_directory RPC receives p_viewer_actor_id: null; blocked actor suppression and personalized results never applied in primary search path
- MEDIUM: BW-EXPLORE-003 — searchPosts / searchPostsByTag have no viewer-scoped filter; private actor post exposure risk if vc.posts RLS does not restrict private actor content
- MEDIUM: VEN-EXPLORE-004 — 45s module-level search cache not scoped to viewer identity; cross-session leak risk on shared devices; actor-switch does not invalidate cache
- LOW: VEN-EXPLORE-005 — legacy userId / ownerUserId fields in mapActorSearchResult and mapVportSearchResult; violates VCSM identity contract (no raw user IDs in model outputs)
- LOW: BW-EXPLORE-004 — hydrateActorsByIds called fire-and-forget with silenced errors in ctrlSearchResults; unvalidated RPC data written to hydration store

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm searchResults.controller.js — viewerActorId source; confirm it is always null or hardcoded
- [ ] Confirm cache invalidation strategy — is cache cleared on logout/actor switch?
- [ ] Confirm vc.posts RLS — does it restrict private actor content for unauthenticated queries?
- [ ] Remove userId/ownerUserId from model outputs (VEN-EXPLORE-005)
