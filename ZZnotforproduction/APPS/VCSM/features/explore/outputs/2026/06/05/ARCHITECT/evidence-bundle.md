# Evidence Bundle — VCSM:explore
## ARCHITECT V2 | 2026-06-05 | Scanner 1.1.0

**Scope:** VCSM:explore
**Source files validated:** 22
**Overall confidence:** HIGH
**Scanner preflight:** PASS (all maps FRESH, ~23h old)

---

## Source Files Read

| Layer | Count | Files |
|---|---|---|
| DAL | 1 file (4 functions) | `dal/search.dal.js` |
| Controller | 3 | `controller/searchResults.controller.js`, `controller/searchTabs.controller.js`, `usecases/search.usecase.js` |
| Hook | 3 | `hooks/useSearchScreenController.js`, `hooks/useSearchActor.js`, `hooks/useSearchTabsActor.js` |
| Model | 1 file (9 functions) | `model/search.model.js` |
| Screen | 2 | `screens/ExploreScreen.jsx`, `ui/SearchScreen.view.jsx` |
| Component | 11 | See below |
| Module/Barrel | 1 | `ui/index.jsx` |

**Components:**
- `ui/ActorSearchResultRow.jsx`
- `ui/CitizensRow.jsx` *(DEAD AT RUNTIME — SHOW_EXPLORE_DISCOVERY_BLOCKS=false)*
- `ui/EmptyState.jsx`
- `ui/ExploreFeed.jsx` *(permanently returns null — hardcoded flag)*
- `ui/FeatureSearchResultRow.jsx`
- `ui/FeaturedResultCard.jsx`
- `ui/FilterTabs.jsx` *(CONFIRMED DEAD CODE — not imported anywhere)*
- `ui/PostCard.jsx`
- `ui/ResultList.jsx`
- `ui/VportsRow.jsx` *(DEAD AT RUNTIME — SHOW_EXPLORE_DISCOVERY_BLOCKS=false)*
- `ui/features/WanderCardSearch.jsx`

---

## Layer Counts

| Layer | Count |
|---|---|
| dal_count | 4 (functions) |
| controller_count | 3 |
| hook_count | 3 |
| model_count | 9 (functions in 1 file) |
| screen_count | 2 |
| component_count | 11 |
| route_count | 1 |
| mutation_surface_count | 0 (identity RPC is semantically read-only) |
| engine_dependencies | 2 (hydration, identity) |

---

## Call Chains Summary

| Chain ID | Path | User Params | UUID Risk |
|---|---|---|---|
| CHAIN-explore-001 | ExploreScreen → useSearchScreenController → ctrlSearchResults → searchDal → identity RPC | query, filter | NO |
| CHAIN-explore-002 | ExploreScreen → useSearchScreenController → ctrlSearchResults → searchDal → vc.posts | query (ilike), filter | NO |
| CHAIN-explore-003 | ctrlSearchResults → hydrateActorsByIds (fire-and-forget) | actorIds from results | NO |
| CHAIN-explore-004 | useSearchTabsActor → ctrlSearchTabs → searchDal | query, filter, limit, offset | NO |
| CHAIN-explore-005 | ResultList → PostCard → navigate('/posts/${post.id}') | post.id (UUID) | **YES — VIOLATION** |
| CHAIN-explore-006 | ResultList → ActorSearchResultRow → navigate('/profile/${username ?? actor_id}') | actor_id (UUID fallback) | **YES — VIOLATION** |

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| identity.search_actor_directory | dal/search.dal.js | null viewerActorId accepted; privacy enforcement server-side only | HIGH |
| vc.posts SELECT (searchPosts) | dal/search.dal.js | Direct table SELECT; RLS unverified; ilike on user query | HIGH |
| vc.posts SELECT (searchPostsByTag) | dal/search.dal.js | Same; tag-based retrieval without schema-qualifier | HIGH |
| PostCard navigation | ui/PostCard.jsx | Raw UUID in /posts/ URL — platform rule violation | HIGH |
| ActorSearchResultRow navigation | ui/ActorSearchResultRow.jsx | UUID fallback in /profile/ URL — platform rule violation | HIGH |

---

## Dead Code Signals

| File | Classification | Evidence |
|---|---|---|
| `ui/FilterTabs.jsx` | CONFIRMED DEAD | No import found anywhere in codebase |
| `ui/CitizensRow.jsx` | DEAD AT RUNTIME | Only caller is ExploreFeed; ExploreFeed has `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` |
| `ui/VportsRow.jsx` | DEAD AT RUNTIME | Same as CitizensRow |
| `ui/ExploreFeed.jsx` | EFFECTIVELY DEAD | Returns null unconditionally due to hardcoded flag |

---

## Behavior IDs Referenced

None — BEHAVIOR.md is a PLACEHOLDER. No declared behavior entries exist.

---

## Engine Usage

| Engine | Method | Called From |
|---|---|---|
| hydration | hydrateActorsByIds | controller/searchResults.controller.js (fire-and-forget) |
| identity | identity.search_actor_directory (RPC) | dal/search.dal.js |

---

## Downstream Handoffs

- **VENOM**: Raw UUID in navigation (PostCard, ActorSearchResultRow); vc.posts RLS verification; identity RPC null-viewer path
- **LOGAN**: Write real BEHAVIOR.md
- **SPIDER-MAN**: Zero test coverage; barrel import path case-sensitivity (Linux CI risk)
- **IRONMAN**: FilterTabs dead code cleanup; ExploreFeed flag; consolidate usecase vs controller; create adapter file
