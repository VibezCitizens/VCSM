---
title: Search Module — Architecture
status: STUB
feature: explore
module: search
source: architect-derived
created: 2026-06-05
---

# explore / modules / search — ARCHITECTURE

## Layer Stack

```
useSearchScreenController.js (45s cache, module-level — not viewer-scoped)
  └── search.usecase.js
        └── search.dal.js (dispatcher)
              ├── searchActors(query, viewerActorId=null)  ← THOR BLOCKER: always null
              │     └── identity.search_actor_directory RPC
              │           p_viewer_actor_id: null  ← blocked actors NOT suppressed
              │
              ├── searchPosts(query)  ← no viewer scope
              │     └── vc.posts SELECT (deleted_at IS NULL, is_hidden=false)
              │
              └── searchPostsByTag(tag)  ← no viewer scope
                    └── vc.posts SELECT by tag
```

## Tab Search Stack

```
useSearchTabsActor.js
  └── ctrlSearchTabs → search.dal.js
        └── viewerActorId from props (not session)  ← PARTIAL
```

## Post-Search Hydration (fire-and-forget)

```
ctrlSearchResults
  └── hydrateActorsByIds(actorIds)  ← errors silenced
        └── hydration engine → hydration store
```

## Model Layer

```
search.model.js
  ├── normalizeActorRow, normalizeResult
  ├── dedupeByKindAndId
  ├── mapActorSearchResult    → includes userId (LEGACY — violates identity contract)
  ├── mapVportSearchResult   → includes ownerUserId (LEGACY — violates identity contract)
  ├── mapPostSearchResult
  ├── mapVideoSearchResult
  ├── mapGroupSearchResult
  └── mapSearchResult (dispatcher)
```

## TODO

- [ ] Confirm ctrlSearchResults viewerActorId source — is it passed in or always null?
- [ ] Confirm cache key in useSearchScreenController — includes viewerActorId?
- [ ] Trace hydrateActorsByIds error handling path
