# MODULE ARCHITECTURE REPORT

**Module:** explore
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Actor/Content Search & Discovery
**Primary Root:** `apps/VCSM/src/features/explore/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns the Explore/Search screen: full-text actor search, tab-based filtering (Citizens, VPORTs, Posts, Wanders cards), search results rendering, and featured/curated results. Entry point for discovery within the VCSM platform.

---

## ENTRY POINTS

- `/explore` → `ExploreScreen.jsx`

---

## LAYER MAP

**DAL:** `search.dal.js` — multi-table search query

**Model:** `search.model.js` — normalizes and deduplicates search results

**Controller:**
- `searchResults.controller.js` — result assembly
- `searchTabs.controller.js` — tab filtering logic

**Hook:**
- `useSearchActor.js`
- `useSearchScreenController.js`
- `useSearchTabsActor.js`

**Usecase:** `usecases/search.usecase.js` — **LAYER VIOLATION: usecase contains business logic that belongs in controller**

**UI Components:**
- `ActorSearchResultRow.jsx`, `CitizensRow.jsx`, `EmptyState.jsx`, `ExploreFeed.jsx`, `FeatureSearchResultRow.jsx`, `FeaturedResultCard.jsx`, `FilterTabs.jsx`, `PostCard.jsx`, `ResultList.jsx`, `SearchScreen.view.jsx`, `VportsRow.jsx`
- `features/WanderCardSearch.jsx`
- `ui/index.jsx`

**Screen:** `ExploreScreen.jsx`

**Adapter:** NONE — no adapter defined

**Store:** None
**Engine Consumers:** @hydration (actor data in results)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Search/discovery clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | ExploreScreen routed | — |
| Controllers present/delegated | PARTIAL | 2 controllers + usecases/ | usecases/ = redundant layer |
| DAL/repository present/delegated | PASS | search.dal.js | — |
| Models/transformers present | PASS | search.model.js | — |
| Hooks/view models present | PASS | 3 hooks | — |
| Screens/components present | PASS | 1 screen + 11 UI components | — |
| Services/adapters present | FAIL | No adapter | Cannot be safely consumed cross-feature |
| Database objects mapped | PARTIAL | vc.actors, vc.posts, wanders tables | — |
| Authorization path mapped | PARTIAL | Search is authenticated but no explicit gate | — |
| Cache/runtime behavior mapped | FAIL | No cache documented | Search results re-fetched per keystroke |
| Error/loading/empty states mapped | PARTIAL | EmptyState component present | Loading state unclear |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | @hydration via actor hydration | — |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Search results | derived | explore | ExploreScreen | — |
| PostCard in explore | read | explore (own PostCard) | explore UI | Duplicate of post/postCard? |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `usecases/search.usecase.js` | Business logic outside controller layer | HIGH — architecture violation | SENTRY |
| `explore/ui/PostCard.jsx` | Local PostCard — possible duplicate of post/postcard | HIGH | IRONMAN |
| No adapter | Module has no public API surface | MEDIUM | IRONMAN |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Move usecase logic to controller | HIGH | Architecture violation — usecases are not a defined layer | SENTRY |
| Create explore.adapter.js | HIGH | No public boundary | IRONMAN |
| Resolve PostCard duplication | HIGH | explore/ui/PostCard.jsx vs post/postCard — which is used? | IRONMAN |
| Search debounce/cache | HIGH | Per-keystroke DB queries = performance | KRAVEN |
| Logan documentation | HIGH | No canonical explore architecture | LOGAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: usecase layer violation)
- IRONMAN (ownership: PostCard duplication, missing adapter)
- KRAVEN (performance: search caching)
- LOGAN (documentation)
