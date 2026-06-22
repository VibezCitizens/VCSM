---
name: vcsm.explore.architecture
description: ARCHITECT V2 module architecture report for VCSM:explore
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-05
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** explore
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/explore
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The explore module is the platform-wide search and discovery surface, enabling Citizen users to search for other actors (users and Vports), posts, and platform features using free-text queries, hashtag-prefixed tag searches, and filter tabs. It delegates actor directory lookups to the `identity.search_actor_directory` RPC and resolves post content directly from `vc.posts`. Results are deduplicated, cached client-side with a 45-second TTL, and hydrated via the `hydration` engine.

## OWNERSHIP

VCSM platform team — social discovery domain. This module is standalone from a data-write perspective (read-heavy, single write surface via the identity RPC). It is consumed directly from the app router as a full-page search experience.

## ENTRY POINTS

| Entry Point | Access | Description |
|---|---|---|
| `/explore` route (barrel: `ui/index.jsx`) | Public (declared public:false in barrel but route-map classifies as public) | Mounts ExploreScreen as top-level tab destination |
| `ExploreScreen.jsx` (screens/) | Internal | Root screen — wraps SearchScreen.view with Suspense |
| `useSearchActor()` hook | Exported adapter surface | Thin re-export of `useSearchScreenController` for cross-feature actor search |

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 6 | `dal/search.dal.js` — searchActors (identity RPC), searchPosts (vc.posts direct), searchPostsByTag, searchDal dispatcher |
| Model | 9 | `model/search.model.js` — normalizeActorRow, normalizeResult, dedupeByKindAndId, mapActorSearchResult, mapVportSearchResult, mapPostSearchResult, mapVideoSearchResult, mapGroupSearchResult, mapSearchResult |
| Controller | 3 | `controller/searchResults.controller.js` (ctrlSearchResults), `controller/searchTabs.controller.js` (ctrlSearchTabs), `usecases/search.usecase.js` (searchUsecase — controller-layer usecase) |
| Service | N/A | None |
| Adapter | N/A | No dedicated adapter file detected; useSearchActor.js functions as a thin adapter shim |
| Hook | 9 | `hooks/useSearchScreenController.js` (primary view model), `hooks/useSearchActor.js` (re-export shim), `hooks/useSearchTabsActor.js` |
| Component | 11 | `ui/ActorSearchResultRow.jsx`, `ui/CitizensRow.jsx`, `ui/EmptyState.jsx`, `ui/ExploreFeed.jsx`, `ui/FeatureSearchResultRow.jsx`, `ui/FeaturedResultCard.jsx`, `ui/FilterTabs.jsx`*, `ui/PostCard.jsx`, `ui/ResultList.jsx`, `ui/VportsRow.jsx`*, `ui/features/WanderCardSearch.jsx` |
| Screen | 2 | `screens/ExploreScreen.jsx`, `ui/SearchScreen.view.jsx` |
| Barrel | 1 | `ui/index.jsx` (route barrel — mounts ExploreScreen, declares /explore route) |

Note: `usecases/search.usecase.js` is architecturally controller-layer despite residing in a `usecases/` folder. `styles/explore-modern.css` is a style file not counted in functional layers.

*`FilterTabs.jsx` is not imported anywhere — CONFIRMED DEAD. `CitizensRow.jsx` and `VportsRow.jsx` are rendered only behind `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` flag — DEAD AT RUNTIME.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source clearly implements search; BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md has no real contract — only "pending source review" |
| Owner defined | PARTIAL | Source exists, no explicit owner declaration | No ownership record in governance docs |
| Entry points mapped | PASS | `ui/index.jsx` exports /explore route; ExploreScreen confirmed | Route scanner confirms 1 public-classified route |
| Controllers present/delegated | PASS | 3 controllers (searchResults, searchTabs, usecase) | `usecases/` folder is an architectural inconsistency — usecase duplicates ctrlSearchTabs logic |
| DAL/repository present/delegated | PASS | 6 DAL functions in search.dal.js | Direct `vc.posts` table access from DAL (no schema qualifier on posts query) bypasses RPC pattern used elsewhere |
| Models/transformers present | PASS | 9 model functions | Dual normalization paths: normalizeActorRow + normalizeResult coexist; both map actor rows with slightly different field names (potential drift risk) |
| Hooks/view models present | PASS | 9 hooks (including shims) | useSearchTabsActor.js not read — may duplicate useSearchScreenController |
| Screens/components present | PASS | 2 screens, 11 components | SearchScreen.view.jsx not yet read — internal structure assumed complete |
| Services/adapters present | PARTIAL | No adapter file; useSearchActor.js is a 3-line shim | Missing formal adapter boundary — cross-feature consumers import hook directly |
| Database objects mapped | PARTIAL | identity.search_actor_directory (RPC), vc.posts (direct table read) | Direct posts read without explicit column schema qualifier may be policy-inconsistent |
| Authorization path mapped | PARTIAL | viewerActorId passed to identity RPC; no auth gate at screen entry | /explore barrel marks route public:false but scan marks access public — needs clarification |
| Cache/runtime behavior mapped | PASS | 45s TTL in-memory LRU cache (max 120 entries) in useSearchScreenController | In-memory cache lost on remount; no persistence |
| Error/loading/empty states mapped | PASS | loading, error, results state in useSearchScreenController; EmptyState.jsx component present | |
| Documentation linked | FAIL | BEHAVIOR.md present but is a PLACEHOLDER | No real behavior contract defined |
| Tests/validation noted | FAIL | 0 tests | Zero test coverage for search logic, DAL, or model functions |
| Native parity noted | N/A | Web-only feature | |
| Engine dependencies mapped | PASS | directory engine (identity RPC), hydration engine | Both confirmed in source imports |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `identity` engine (directory) | Engine | explore → engines/directory | Approved | Via identity.search_actor_directory RPC in search.dal.js |
| `hydration` engine | Engine | explore → engines/hydration | Approved | hydrateActorsByIds called fire-and-forget in ctrlSearchResults |
| `vc.posts` table (Supabase direct) | DB direct read | explore → DB | Acceptable (read-only) | searchPosts() and searchPostsByTag() query vc.posts directly |
| `identity.search_actor_directory` RPC | DB RPC | explore → DB | Approved | Primary actor search surface |
| `@i18n` | Shared | explore → shared | Approved | Translation hook used in ExploreScreen |
| `@/features/ui` | Cross-feature | explore → features/ui | Watch | Imports `module-modern.css` from features/ui — should verify adapter boundary |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `identity.search_actor_directory` RPC | RPC read | identity engine / DB | explore.dal | Viewer actor ID injected for personalization — null is safe (returns public results) |
| `vc.posts` | Direct table SELECT | DB | explore.dal | Read-only; no RLS bypass risk; deletedAt and is_hidden filters applied in query |
| In-memory search cache | Runtime state | useSearchScreenController | Same hook | 45s TTL, max 120 entries; no cross-session persistence |
| localStorage `search:lastFilter` | Browser storage | useSearchScreenController | Same hook | Stores last active filter tab per device |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | /explore route declared in ui/index.jsx; ExploreScreen mounts via Suspense | Route barrel has minor path inconsistency (imports from `@/features/explore/screen/ExploreScreen` but folder is `screens/` — may be aliased or typo) |
| Loading state | READY | loading boolean in useSearchScreenController; Suspense fallback in ExploreScreen | |
| Empty state | READY | EmptyState.jsx component present; results cleared on empty debounced query | |
| Error state | READY | error state set in catch block; results cleared on error | Error surfacing to UI depends on SearchScreen.view.jsx consuming error prop |
| Auth/owner gates | PARTIAL | viewerActorId passed as null by default to DAL; no hard auth guard on screen entry | Public actor searches work unauthenticated; private actor gating delegated to identity RPC |
| Cache behavior | READY | 45s TTL in-memory LRU in useSearchScreenController; inflight dedup via searchInflight Map | Cache is module-local (not shared with actors or chat features that also call identity RPC) |
| Runtime dependencies | READY | hydrateActorsByIds called fire-and-forget — failure silently swallowed | Hydration errors suppressed; actor display data may be stale if hydration fails |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/explore/BEHAVIOR.md | PRESENT — PLACEHOLDER ONLY |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | No behavior contract exists — team cannot reason about intended vs actual behavior, edge cases, or search scope | LOGAN |
| Zero test coverage | HIGH | DAL, model normalization, and cache logic have no tests; dual normalization paths (normalizeActorRow vs normalizeResult) are diverging silently | SPIDER-MAN |
| Raw UUID in PostCard navigation | HIGH | PostCard navigates to `/posts/${post.id}` using raw DB UUID — violates platform no-raw-IDs-in-URLs rule | VENOM |
| Raw UUID fallback in ActorSearchResultRow | HIGH | `navigate('/profile/${actor.username ?? actor.actor_id}')` falls back to raw UUID — violates platform no-raw-IDs-in-URLs rule | VENOM |
| FilterTabs.jsx is dead code | MEDIUM | Component renders a different tab set to SearchScreen.view.jsx (which implements its own inline tabs); FilterTabs.jsx is not imported anywhere — confirmed dead | IRONMAN |
| ExploreFeed discovery blocks disabled | MEDIUM | `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` hardcoded in ExploreFeed.jsx; CitizensRow and VportsRow are permanently unreachable at runtime | IRONMAN |
| No formal adapter file | MEDIUM | Cross-feature consumers must import hooks directly rather than through a declared adapter boundary | IRONMAN |
| Dual normalization path drift | MEDIUM | normalizeActorRow and normalizeResult both map actor search rows with overlapping but non-identical field names; one camelCase, one snake_case | IRONMAN |
| Import path inconsistency in barrel | LOW | ui/index.jsx imports from `@/features/explore/screen/ExploreScreen` (singular) but folder is `screens/` (plural) — masked by macOS case-insensitive FS; CI/Linux would fail | SPIDER-MAN |
| usecases/ layer is architecturally redundant | LOW | search.usecase.js duplicates ctrlSearchTabs.controller.js logic; two nearly identical controller-layer entry points exist | IRONMAN |
| videos and groups filter stubs | LOW | DAL returns empty arrays for 'videos' and 'groups' filters; filter tabs render these as active options leading to confusing UX | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

1. **Cross-feature CSS import**: `ExploreScreen.jsx` imports `@/features/ui/modern/module-modern.css` directly from another feature's internal path. This bypasses the adapter boundary rule. If the `ui` feature restructures its internals this import will break silently.

2. **usecases/ folder naming**: The `usecases/search.usecase.js` file uses a relative import (`../dal/search.dal`) rather than the `@/` path alias required by the VCSM engineering rules. This is a rule violation.

3. **Direct vc.posts table access**: `search.dal.js` queries `vc.posts` directly (without a schema-qualified Supabase call). The actors feature and identity RPC both have explicit schema qualifiers. This inconsistency should be noted.

4. **Raw UUID in navigation — PostCard.jsx**: `navigate('/posts/${post.id}')` exposes raw DB UUID in public URL. The platform rule requires human-readable slugs for all public-facing navigation. Route to VENOM.

5. **Raw UUID fallback — ActorSearchResultRow.jsx**: `navigate('/profile/${actor.username ?? actor.actor_id}')` falls back to UUID when username is null. Null username is possible from the identity RPC result shape. Route to VENOM.

6. **FilterTabs.jsx: CONFIRMED DEAD CODE**: No import exists for FilterTabs.jsx across the entire explore module or any consuming module. SearchScreen.view.jsx implements its own inline filter tabs using FILTER_KEYS. FilterTabs.jsx is an orphaned component — safe to DELETE CANDIDATE after LOKI and IRONMAN confirmation.

7. **ExploreFeed.jsx: permanently flag-disabled**: `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` at the top of ExploreFeed.jsx unconditionally returns null. CitizensRow and VportsRow are rendered only when this flag is true — making both components dead at runtime. These are stub UI with hardcoded fake data (no DAL backing), confirming they are early scaffolding, not shipped features.

---

## SPAGHETTI SCORE

**Module:** explore
**Score:** WATCH
**Reasons:** Dual normalization paths with overlapping field maps; redundant usecase vs controller layer; cross-feature CSS import; relative import in usecases/ violates path alias rule; barrel has a possible path typo; FilterTabs.jsx is dead code; ExploreFeed permanently disabled by hardcoded flag; raw UUID exposed in PostCard and ActorSearchResultRow navigation paths. No cross-feature DAL violations found. Logic is mostly layered correctly.
**Release risk:** MEDIUM — raw UUID in navigation URLs violates the platform no-IDs-in-URLs contract and must be resolved before any explore-touching release. All other issues are LOW release risk.

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — "Behavior contract pending source review"

**Check A (Source without behavior):** FAIL — Source is fully implemented; BEHAVIOR.md has not been written.
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no declared happy paths to compare.
**Check C (§13 engine consistency):** Scanner declares engines: `directory`, `hydration`. Source confirms: `identity.search_actor_directory` RPC (directory engine) and `hydrateActorsByIds` (hydration engine). PASS on engine presence.
**Check D (§6 data change consistency):** Scanner declares 1 write surface: `identity.search_actor_directory` RPC (classified as write by scanner due to RPC op type, but semantically a read). Direct `vc.posts` reads are not declared as write surfaces. PASS — no undeclared mutations.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md | PLACEHOLDER has no contract; search scope, filter behaviors, hashtag mode, and viewerActorId semantics are undocumented | LOGAN |
| P2 | Add test coverage for model normalization and cache logic | Dual normalization paths can diverge silently; zero tests | SPIDER-MAN |
| P3 | Consolidate dual normalization paths | normalizeActorRow + normalizeResult overlap; pick one canonical path | IRONMAN |
| P4 | Create formal adapter file | Expose only `useSearchActor` and route barrel through a typed adapter boundary | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — Write the real BEHAVIOR.md (search scope, filter tabs, hashtag mode, empty/error states, viewerActorId semantics)
- **SPIDER-MAN** — Add unit tests for model normalization, DAL filter dispatch, and cache TTL logic; verify barrel import path on Linux
- **IRONMAN** — Consolidate usecase vs controller redundancy; create adapter file; fix relative import in usecases/; confirm FilterTabs dead code deletion
- **VENOM** — Audit direct vc.posts SELECT for RLS policy coverage; verify identity RPC null viewerActorId is safe in all auth states; raw UUID in PostCard + ActorSearchResultRow navigation (HIGH priority)

---

## Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence |
|---|---|---|---|---|
| feature-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH |
| callgraph | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH |
| write-surface-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH |
| route-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH |
| engine-candidates | 2026-06-04T20:29:11Z | ~23h | FRESH | MEDIUM |
| dependency-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH |

**ARCHITECT V2 run:** 2026-06-05 | **Source files validated:** 22 | **Overall preflight:** PASS
