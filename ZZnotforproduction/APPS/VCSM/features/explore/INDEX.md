---
name: vcsm.explore.index
description: VCSM explore feature source inventory — rebuilt by ARCHITECT V2 2026-06-05
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-05
---

# INDEX — VCSM / features / explore

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-05
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 3 | searchResults.controller.js, searchTabs.controller.js, usecases/search.usecase.js (controller-layer despite folder name) |
| DAL files | 6 | search.dal.js contains searchActors (identity RPC), searchPosts (vc.posts direct), searchPostsByTag, searchDal dispatcher — scanner counts 6 including callgraph expansions |
| Hooks | 9 | useSearchScreenController.js (primary view model with 45s cache), useSearchActor.js (thin re-export), useSearchTabsActor.js |
| Models | 9 | search.model.js — normalizeActorRow, normalizeResult, dedupeByKindAndId, mapActorSearchResult, mapVportSearchResult, mapPostSearchResult, mapVideoSearchResult, mapGroupSearchResult, mapSearchResult |
| Screens | 2 | screens/ExploreScreen.jsx, ui/SearchScreen.view.jsx |
| Components | 11 | ActorSearchResultRow, CitizensRow*, EmptyState, ExploreFeed†, FeatureSearchResultRow, FeaturedResultCard, FilterTabs‡, PostCard, ResultList, VportsRow*, ui/features/WanderCardSearch |
| Adapters | 0 | No formal adapter file; useSearchActor.js serves as an informal shim only |
| Barrels | 1 | ui/index.jsx — declares /explore route and exports module config |
| Tests | 0 | No test files detected by scanner |
| Routes | 1 | apps/VCSM/src/features/explore/ui/index.jsx — access: public (scanner classification); barrel declares `public: false` — needs reconciliation |
| Total source files | 23 | 22 per scanner feature-map + WanderCardSearch.jsx confirmed at ui/features/ (styles/explore-modern.css and usecases/ included) |

*CitizensRow and VportsRow are dead at runtime — ExploreFeed has `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` hardcoded.
†ExploreFeed permanently returns null due to hardcoded flag.
‡FilterTabs.jsx is not imported anywhere — CONFIRMED DEAD CODE.

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | identity | — | searchActors → search_actor_directory |

Note: The identity.search_actor_directory RPC is semantically a read operation (actor directory lookup). The scanner classifies RPC calls as write surfaces by default due to op type. No actual data mutations occur in this module.

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| identity.search_actor_directory RPC | dal/search.dal.js | p_viewer_actor_id null path; private actor suppression enforced server-side? | HIGH |
| vc.posts SELECT (searchPosts) | dal/search.dal.js | Direct table read; RLS coverage unverified; schema-qualifier absent | HIGH |
| vc.posts SELECT (searchPostsByTag) | dal/search.dal.js | Same as above; tagged posts read without schema-qualifier | HIGH |
| PostCard navigation | ui/PostCard.jsx | `navigate('/posts/${post.id}')` — raw UUID in public URL; violates no-IDs-in-URLs rule | HIGH |
| ActorSearchResultRow navigation | ui/ActorSearchResultRow.jsx | `/profile/${actor.username ?? actor.actor_id}` — UUID fallback when username is null | HIGH |

## Engine Dependencies

- `directory` (identity engine) — via `identity.search_actor_directory` RPC in search.dal.js
- `hydration` (hydration engine) — via `hydrateActorsByIds` called fire-and-forget in searchResults.controller.js

## Routes

| Path | Access |
|---|---|
| /explore (via apps/VCSM/src/features/explore/ui/index.jsx) | public (scanner classification); barrel declares `public: false` — needs reconciliation |

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — PLACEHOLDER ONLY (no real contract) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
| SCREENS.md | PRESENT |
